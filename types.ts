
export interface CameraFilter {
  id: string;
  name: string;
  css: string;
  description: string;
}

export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  filterId: string;
  isAiEnhanced: boolean;
}

export enum CameraMode {
  AUTO = 'AUTO',
  VINTAGE = 'VINTAGE',
  PRO = 'PRO',
  MONO = 'MONO'
}
