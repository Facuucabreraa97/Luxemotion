export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1'
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p'
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  telegram?: string;
  avatar?: string | null;
  credits?: number;
  plan?: 'starter' | 'creator' | 'agency';
  is_admin?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'ACTIVE';
  role?: string;
}

export interface Talent {
  id: string;
  name: string;
  image_url: string;
  notes?: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  date: string;
  aspectRatio: string;
  cost: number;
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
