
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p'
}

export interface VideoGenerationState {
  isGenerating: boolean;
  progress: string;
  videoUrl: string | null;
  error: string | null;
  simulationData?: SimulationMetadata | null;
}

export interface SimulationMetadata {
  subject: string;
  wardrobe: string;
  environment: string;
  mood: string;
  colors: string[];
  materials: string[];
  lighting: string;
  framing: string;
  pose: string;
  cinematicKeywords: string[];
}

export interface GenerationParams {
  prompt: string;
  image: string | null; // Base64
  aspectRatio: AspectRatio;
  resolution: Resolution;
}
