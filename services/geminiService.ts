import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, LensConfig, ReferenceImage } from "../types";
import { LENSES } from "../constants";

// Extend the global AIStudio interface to support key selection methods.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const MODEL_NAME = "gemini-3-pro-image-preview";
const LOCAL_STORAGE_KEY = "k_beauty_studio_api_key_v1";

// --- API Key Management ---

/**
 * Retrieves the API key from Local Storage (decrypted) or falls back to env var.
 */
export const getApiKey = (): string | null => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return atob(stored); // Simple Base64 decode
    }
  } catch (e) {
    console.error("Failed to retrieve API key", e);
  }
  return process.env.API_KEY || null;
};

/**
 * Encrypts (Obfuscates) and saves the API key to Local Storage.
 */
export const saveApiKey = (key: string) => {
  if (!key) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return;
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, btoa(key)); // Simple Base64 encode
};

/**
 * Validates the API Key by making a lightweight call.
 */
export const validateConnection = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    // Use a lightweight model for validation
    await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: "ping",
    });
    return true;
  } catch (error) {
    console.error("Connection validation failed:", error);
    return false;
  }
};

/**
 * Ensures a valid API key is available.
 */
function getClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. 설정 버튼을 눌러 API Key를 등록해주세요.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Helper to parse Data URL to extract MimeType and Base64 Data
 */
function parseDataUrl(dataUrl: string): { mimeType: string, data: string } {
  try {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (matches && matches.length >= 3) {
      return { mimeType: matches[1], data: matches[2] };
    }
    
    // Fallback for less standard data URLs
    const splitComma = dataUrl.split(',');
    if (splitComma.length === 2) {
      const mimeMatch = splitComma[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      return { mimeType, data: splitComma[1] };
    }
  } catch (e) {
    console.warn("Failed to parse data URL strictly, attempting fallback", e);
  }
  throw new Error("Invalid image data format. Please try uploading the image again.");
}

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

function getBaseStylePrompt(lens: LensConfig): string {
  return `
    High-end commercial fashion photography.
    Luxury fashion magazine editorial style.
    Sophisticated, modern, and trendy aesthetic.
    Flawless skin texture, vivid colors, professional studio lighting.
    Bright and lively atmosphere, photo-realistic 8K resolution.
    Ultra-detailed, sharp focus on eyes and face.
    Crystal clear quality, clean composition.
    
    Subject details:
    Professional female fashion model.
    Elegant and confident pose.
    Charming and attractive face, professional makeup styling.
    Detailed facial features, expressive eyes.

    Camera: Canon EOS R5.
    Lens: ${lens.name} (${lens.focalLength}, ${lens.aperture}).
    Technique: ${lens.description}.
  `;
}

function getGridPrompt(settings: GenerationSettings): string {
  if (settings.gridCount === 1) {
    const effectiveAngle = settings.customCameraAngles[0]?.trim() || settings.cameraAngles[0];
    const effectivePose = settings.customPoses[0]?.trim() || settings.poses[0];

    return `
      Composition: Single full-frame high-quality photo.
      Camera Angle: ${effectiveAngle}.
      Pose: ${effectivePose}.
    `;
  }

  const sizingDesc = settings.gridSizing === 'uniform' 
    ? "Split the image into equal-sized panels." 
    : "Create a collage with varied sized panels (artistic layout).";
  
  let panelsDesc = "";
  settings.poses.forEach((pose, idx) => {
    const angle = settings.customCameraAngles[idx]?.trim() || settings.cameraAngles[idx];
    const finalPose = settings.customPoses[idx]?.trim() || pose;
    panelsDesc += `Panel ${idx + 1}: Angle: ${angle}, Pose: ${finalPose}\n`;
  });

  return `
    FORMAT: PHOTO COLLAGE / SPLIT SCREEN.
    Count: ${settings.gridCount} distinct distinct sub-images (panels) merged into one final image file.
    Layout: ${sizingDesc}
    
    PANEL CONFIGURATIONS (Angle & Pose per cut):
    ${panelsDesc}
    
    Ensure borders between panels are clean (white or thin black line or gapless).
    Maintain consistent lighting and color grading across all panels.
  `;
}

function getPriorityInstructions(settings: GenerationSettings): string {
  if (!settings.additionalPrompt || settings.additionalPrompt.trim() === "") {
    return "";
  }
  return `
    *** GLOBAL OVERRIDE INSTRUCTIONS (HIGHEST PRIORITY) ***
    USER REQUEST: "${settings.additionalPrompt}"
    
    CRITICAL NOTE: 
    The "USER REQUEST" above takes ABSOLUTE PRECEDENCE over any specific camera angle, pose, or layout settings defined previously.
    If the user request contradicts the selected pose or angle, IGNORE the selection and FOLLOW the user request.
  `;
}

async function handleResponse(response: any): Promise<string> {
    // Check if candidates exist
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            if (reason === 'OTHER') {
                 throw new Error("Generation blocked (Reason: OTHER). The system may have interpreted the prompt or reference image as sensitive. Please try a different pose or reference image.");
            }
            throw new Error(`Generation blocked: ${reason}. The prompt may have violated safety policies.`);
        }
        throw new Error("The model returned no results. This might be due to high safety settings or a refusal to generate the specific content.");
    }

    const candidate = response.candidates[0];
    
    // Check finish reason
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        if (candidate.finishReason === 'SAFETY') {
             throw new Error("Generation blocked by safety filters. Please try modifying the prompt or using a different reference image.");
        }
        if (candidate.finishReason === 'RECITATION') {
             throw new Error("Generation blocked due to recitation check.");
        }
        if (candidate.finishReason === 'OTHER') {
             throw new Error("Generation blocked (Reason: OTHER). This typically occurs when the model detects potential policy violations in the reference images. Please try a different reference image.");
        }
    }

    let textResponse = "";
    // Iterate through parts to find the image
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }
    
    if (textResponse) {
        // If the model returned text but no image, it's usually a refusal explanation.
        throw new Error(`Model Refusal: ${textResponse}`);
    }

    throw new Error(`No image data received from model. Finish Reason: ${candidate.finishReason || 'Unknown'}`);
}

export const generateImage = async (settings: GenerationSettings): Promise<string> => {
  const ai = getClient();
  const selectedLens = LENSES.find(l => l.id === settings.lensId) || LENSES[0];
  const prompt = buildPrompt(selectedLens, settings);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.resolution,
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const editImage = async (
  originalImageUrl: string, 
  editPrompt: string, 
  settings: GenerationSettings
): Promise<string> => {
  const ai = getClient();
  const { mimeType, data } = parseDataUrl(originalImageUrl);
  const selectedLens = LENSES.find(l => l.id === settings.lensId) || LENSES[0];
  const styleContext = getBaseStylePrompt(selectedLens);
  const effectiveAngle = settings.customCameraAngles[0]?.trim() || settings.cameraAngles[0];
  
  const finalPrompt = `
    ${styleContext}
    
    ORIGINAL CONTEXT:
    Concept: ${settings.customLocation || settings.concept}
    Primary Camera Angle: ${effectiveAngle}
    
    USER EDIT REQUEST: 
    ${editPrompt}
    
    Maintain the original composition, lighting, and high-quality 8K aesthetic. 
    Only modify the specific details requested in the edit.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: finalPrompt }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.resolution,
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Image edit error:", error);
    throw error;
  }
};

export const generateConsistentImage = async (
  referenceImageUrl: string,
  newContextPrompt: string,
  settings: GenerationSettings
): Promise<string> => {
  const ai = getClient();
  const { mimeType, data } = parseDataUrl(referenceImageUrl);
  const selectedLens = LENSES.find(l => l.id === settings.lensId) || LENSES[0];
  const styleContext = getBaseStylePrompt(selectedLens);
  const gridPrompt = getGridPrompt(settings);
  const priorityInstructions = getPriorityInstructions(settings);

  const finalPrompt = `
    ${styleContext}

    TASK:
    The provided image is a Reference for a fashion model.
    Generate a NEW high-quality fashion photo featuring a model with a similar look and style (Face, Hairstyle).
    
    LAYOUT & COMPOSITION:
    ${gridPrompt}
    
    NEW SCENE / ACTION REQUIREMENTS:
    ${newContextPrompt}
    
    ${priorityInstructions}
    
    CRITICAL INSTRUCTIONS:
    1. Create a consistent character look inspired by the reference.
    2. Change the Pose, Angle, and Background according to the requirements.
    3. Maintain the "Commercial Beauty Pictorial" aesthetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: finalPrompt }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.resolution,
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Consistent generation error:", error);
    throw error;
  }
};

export const generateFromReferences = async (
  modelRefs: ReferenceImage[],
  clothingRefs: ReferenceImage[],
  settings: GenerationSettings
): Promise<string> => {
  const ai = getClient();
  const selectedLens = LENSES.find(l => l.id === settings.lensId) || LENSES[0];
  const styleContext = getBaseStylePrompt(selectedLens);
  const gridPrompt = getGridPrompt(settings);
  const priorityInstructions = getPriorityInstructions(settings);
  
  const parts: any[] = [];
  
  // 1. Add Model Images
  const selectedModelRefs = modelRefs.filter(r => r.selected);
  for (const ref of selectedModelRefs) {
    const { mimeType, data } = parseDataUrl(ref.url);
    parts.push({
      inlineData: { mimeType, data }
    });
  }

  // 2. Add Clothing Images
  const selectedClothingRefs = clothingRefs.filter(r => r.selected);
  for (const ref of selectedClothingRefs) {
    const { mimeType, data } = parseDataUrl(ref.url);
    parts.push({
      inlineData: { mimeType, data }
    });
  }

  const effectiveConcept = settings.customLocation && settings.customLocation.trim().length > 0 
    ? settings.customLocation 
    : settings.concept;

  let clothingInstruction = "";
  let clothingInputDesc = "";

  if (selectedClothingRefs.length > 0) {
     clothingInputDesc = `- The NEXT ${selectedClothingRefs.length} images are the 'CLOTHING REFERENCE' (Target Outfit).`;
     clothingInstruction = `
     2. OUTFIT REPLACEMENT:
        - Disregard the original clothing.
        - Dress the model in the items from the 'CLOTHING REFERENCE'.
        - Accurately replicate the fabric, color, texture, and silhouette.
        - Ensure the clothing fits naturally.
        (Note: ${settings.clothingPrompt ? `Additional Styling Details: "${settings.clothingPrompt}"` : "Follow the clothing reference."})
     `;
  } else {
     clothingInputDesc = `- No specific clothing reference images provided.`;
     clothingInstruction = `
     2. OUTFIT REPLACEMENT:
        - The user has provided a text description for the new outfit.
        - OUTFIT DESCRIPTION: "${settings.clothingPrompt}"
        - Generate a high-fashion outfit matching this description, replacing the original clothes.
     `;
  }

  const promptText = `
    ${styleContext}

    TASK: Fashion Editorial Creation.

    INPUT REFERENCES:
    - Group A: First ${selectedModelRefs.length} images = Model Visual Reference.
    ${clothingInputDesc}

    INSTRUCTIONS:
    Generate a high-end commercial fashion photo.
    1. MODEL: Create a professional fashion model with the visual characteristics (Face, Hair) of the person in Group A.
    ${clothingInstruction}
    3. COMPOSITION: Seamlessly integrate the model and outfit into the scene.

    SCENE & COMPOSITION:
    Concept/Location: ${effectiveConcept}
    ${gridPrompt}
    
    ${priorityInstructions}
    
    STYLE NOTES:
    - Photorealistic, 8K resolution.
    - Professional fashion lighting.
    - Natural skin texture.
    - Artistic fashion photography.
  `;

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.resolution,
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Reference generation error:", error);
    throw error;
  }
};

export const extractOutfit = async (imageBase64: string): Promise<string> => {
  const ai = getClient();
  const { mimeType, data } = parseDataUrl(imageBase64);

  const prompt = `
    TASK: Analyze the clothing, shoes, and accessories worn by the model in this image.
    Generate a high-end commercial product photography shot of ONLY these items.
    
    STYLE: 
    - "Flat Lay" (items arranged neatly on a surface) OR "Ghost Mannequin" (invisible 3D form).
    - High-fashion magazine catalog style.
    - Professional studio lighting.
    - Clean, neutral background (Off-white or light grey).
    
    CONTENT:
    - Include the main outfit (Top, Bottom, Dress, Outerwear).
    - Include visible accessories (Shoes, Bag, Jewelry, Hats).
    - REMOVE the human body, face, hair, and skin.
    - Focus strictly on the fashion items as a product display.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "2K",
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Outfit extraction error:", error);
    throw error;
  }
};

export const editOutfit = async (imageBase64: string, editPrompt: string): Promise<string> => {
  const ai = getClient();
  const { mimeType, data } = parseDataUrl(imageBase64);

  const prompt = `
    TASK: Edit this fashion product image according to the user's request.
    USER REQUEST: "${editPrompt}"
    
    CONSTRAINTS:
    - Maintain the "Flat Lay" or "Product Photography" style.
    - Keep the background clean and neutral unless specified otherwise.
    - High-quality commercial finish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "2K",
        },
        safetySettings: SAFETY_SETTINGS,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error("Outfit edit error:", error);
    throw error;
  }
};

function buildPrompt(lens: LensConfig, settings: GenerationSettings): string {
  const baseDescription = getBaseStylePrompt(lens);
  const gridPrompt = getGridPrompt(settings);
  const priorityInstructions = getPriorityInstructions(settings);

  const effectiveConcept = settings.customLocation && settings.customLocation.trim().length > 0 
    ? settings.customLocation 
    : settings.concept;

  const context = `
    Concept/Location: ${effectiveConcept}.
    ${gridPrompt}
    
    ${priorityInstructions}
  `;

  return `${baseDescription}\n${context}`;
}
