export enum AspectRatio {
  Square = "1:1",
  Portrait = "3:4",
  Landscape = "4:3",
  Tall = "9:16",
  Wide = "16:9"
}

export type ImageResolution = "1K" | "2K" | "4K";

export type GridCount = 1 | 2 | 3 | 4 | 6 | 9;
export type GridSizing = 'uniform' | 'random';

export interface LensConfig {
  id: string;
  name: string;
  focalLength: string;
  aperture: string;
  description: string;
}

export interface GenerationSettings {
  lensId: string;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  
  // Grid / Layout settings
  gridCount: GridCount;
  gridSizing: GridSizing;
  
  // Poses & Prompts
  cameraAngles: string[]; // Array of preset angles per cut
  customCameraAngles: string[]; // Array of custom input angles per cut
  
  poses: string[]; // Array of preset poses per cut
  customPoses: string[]; // Array of direct input overrides per cut
  
  additionalPrompt: string; // Global Override Request
  clothingPrompt: string; // Specific prompt for clothing in Reference Mode
  
  concept: string;
  customLocation: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface ReferenceImage {
  id: string;
  url: string; // Base64 data URL
  selected: boolean;
}

export type StudioMode = 'standard' | 'reference';
