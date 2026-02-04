export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Finding {
  label: string;
  severity: 'high' | 'moderate' | 'low' | 'fluid'; // High=Malignant(Red), Moderate(Yellow), Low/Fluid(Blue)
  coordinates: BoundingBox;
  polygon?: Point[]; // Optional segmentation mask
  description?: string;
}

export interface AnalysisResult {
  report: string;
  findings: Finding[];
}

export interface ResearchResult {
  summary: string;
  sources: { title: string; uri: string }[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastScan: string;
  modality: string;
  status: 'critical' | 'review' | 'stable';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type SensitivityLevel = 'low' | 'standard' | 'high';

export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  brightness: number; // 0-200, default 100
  contrast: number; // 0-200, default 100
  zoom: number; // 1-5
  pan: { x: number; y: number };
}