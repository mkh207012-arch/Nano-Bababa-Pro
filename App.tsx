import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { GenerationSettings, AspectRatio, GeneratedImage, ReferenceImage, StudioMode } from './types';
import { generateImage, editImage, generateConsistentImage, generateFromReferences, extractOutfit } from './services/geminiService';
import { CONCEPT_GROUPS, FASHION_POSES, CAMERA_ANGLES } from './constants';
import { AlertCircle } from 'lucide-react';
import { OutfitExtractor } from './components/OutfitExtractor';
import { ApiKeyConfig } from './components/ApiKeyConfig';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>({
    lensId: "rf85", // Default to 85mm f/1.2
    aspectRatio: AspectRatio.Portrait,
    resolution: "2K", 
    
    // Grid settings
    gridCount: 1,
    gridSizing: 'uniform',
    
    // Poses & Prompt
    cameraAngles: [CAMERA_ANGLES[0]], // Initialize with 1 random angle
    customCameraAngles: [""],
    
    poses: [FASHION_POSES[0]], // Initialize with 1 random pose
    customPoses: [""], // Initialize empty custom pose
    
    additionalPrompt: "",
    clothingPrompt: "",
    
    concept: CONCEPT_GROUPS.indoor.items[0], 
    customLocation: ""
  });

  const [mode, setMode] = useState<StudioMode>('standard');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference State
  const [modelRefs, setModelRefs] = useState<ReferenceImage[]>([]);
  const [clothingRefs, setClothingRefs] = useState<ReferenceImage[]>([]);

  // Outfit Extractor State
  const [showExtractor, setShowExtractor] = useState(false);
  const [extractorSource, setExtractorSource] = useState<string | null>(null);
  const [extractorResult, setExtractorResult] = useState<string | null>(null);

  // API Config State
  const [showConfig, setShowConfig] = useState(false);

  const addToHistory = (url: string, prompt: string) => {
    setHistory(prev => [{ url, prompt }, ...prev]);
  };

  const processUpload = (files: FileList | null, currentList: ReferenceImage[], setList: React.Dispatch<React.SetStateAction<ReferenceImage[]>>) => {
    if (!files) return;
    
    // Limit to max 10 total
    const remainingSlots = 10 - currentList.length;
    if (remainingSlots <= 0) {
      alert("최대 10장까지만 업로드할 수 있습니다.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setList(prev => [
          ...prev, 
          { id: Math.random().toString(36).substr(2, 9), url: result, selected: true }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleReference = (id: string, setList: React.Dispatch<React.SetStateAction<ReferenceImage[]>>) => {
    setList(prev => prev.map(img => img.id === id ? { ...img, selected: !img.selected } : img));
  };

  const removeReference = (id: string, setList: React.Dispatch<React.SetStateAction<ReferenceImage[]>>) => {
    setList(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let url: string;
      let historyLabel: string;
      
      const gridLabel = settings.gridCount > 1 ? `${settings.gridCount}컷` : '단독컷';

      if (mode === 'standard') {
        url = await generateImage(settings);
        historyLabel = `[${gridLabel}] ${settings.customLocation || settings.concept}`;
      } else {
        // Reference Mode
        const selectedModel = modelRefs.filter(r => r.selected);
        const selectedClothing = clothingRefs.filter(r => r.selected);
        const hasClothingText = settings.clothingPrompt && settings.clothingPrompt.trim().length > 0;
        
        if (selectedModel.length === 0) {
           throw new Error("모델 이미지를 최소 1개 선택해야 합니다.");
        }
        
        if (selectedClothing.length === 0 && !hasClothingText) {
          throw new Error("의상 이미지를 선택하거나 의상 설명을 입력해야 합니다.");
        }

        url = await generateFromReferences(modelRefs, clothingRefs, settings);
        historyLabel = `[${gridLabel}] Ref Mix: ${settings.customLocation || settings.concept}`;
      }

      setImageUrl(url);
      addToHistory(url, historyLabel);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 생성에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (!imageUrl) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const url = await editImage(imageUrl, editPrompt, settings);
      setImageUrl(url);
      addToHistory(url, `수정: ${editPrompt}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 수정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConsistentGenerate = async (newContextPrompt: string) => {
    if (!imageUrl) return;

    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateConsistentImage(imageUrl, newContextPrompt, settings);
      setImageUrl(url);
      addToHistory(url, `다음 컷: ${newContextPrompt}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 생성에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Outfit Extraction Logic ---
  const handleExtractOutfit = async () => {
    const selectedModels = modelRefs.filter(r => r.selected);
    if (selectedModels.length !== 1) {
      alert("의상을 추출할 모델 사진을 정확히 1장만 선택해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    const sourceImg = selectedModels[0].url;

    try {
      const resultUrl = await extractOutfit(sourceImg);
      setExtractorSource(sourceImg);
      setExtractorResult(resultUrl);
      setShowExtractor(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "의상 추출에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddExtractedToRef = (url: string) => {
    setClothingRefs(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), url: url, selected: true }
    ]);
    setShowExtractor(false);
    setExtractorSource(null);
    setExtractorResult(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white font-sans overflow-hidden">
      
      {/* Sidebar Controls */}
      <ControlPanel 
        settings={settings}
        mode={mode}
        onModeChange={setMode}
        onUpdate={setSettings}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        
        // Reference Props
        modelRefs={modelRefs}
        clothingRefs={clothingRefs}
        onUploadModel={(files) => processUpload(files, modelRefs, setModelRefs)}
        onUploadClothing={(files) => processUpload(files, clothingRefs, setClothingRefs)}
        onToggleModel={(id) => toggleReference(id, setModelRefs)}
        onToggleClothing={(id) => toggleReference(id, setClothingRefs)}
        onRemoveModel={(id) => removeReference(id, setModelRefs)}
        onRemoveClothing={(id) => removeReference(id, setClothingRefs)}
        
        // Extraction
        onExtractOutfit={handleExtractOutfit}
        
        // Config
        onOpenConfig={() => setShowConfig(true)}
      />

      {/* Main Preview Area */}
      <main className="flex-1 relative flex flex-col h-full">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/90 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">&times;</button>
          </div>
        )}
        
        <ImageViewer 
          imageUrl={imageUrl} 
          isLoading={isGenerating} 
          onEdit={handleEdit}
          onConsistentGenerate={handleConsistentGenerate}
          history={history}
          onSelectImage={(img) => setImageUrl(img.url)}
        />
        
        {/* Notice for First Time Users */}
        <div className="absolute bottom-4 left-4 z-30 text-[10px] text-gray-600">
           * K-아이돌 뷰티 스튜디오 (Nano Banana PRO)
        </div>
      </main>

      {/* Extraction Modal */}
      {showExtractor && extractorSource && extractorResult && (
        <OutfitExtractor 
          sourceImageUrl={extractorSource}
          initialResultUrl={extractorResult}
          onClose={() => setShowExtractor(false)}
          onAddToReferences={handleAddExtractedToRef}
        />
      )}

      {/* API Key Config Modal */}
      {showConfig && (
        <ApiKeyConfig onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
};

export default App;
