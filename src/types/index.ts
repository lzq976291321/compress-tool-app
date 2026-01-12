export interface FileInfo {
  path: string;
  name: string;
  size: number;
  fileType: 'image' | 'video' | 'other';
  extension: string;
}

export interface ProgressPayload {
  file: string;
  current: number;
  total: number;
  originalSize: number;
  compressedSize: number;
}

export interface CompressResult {
  totalOriginal: number;
  totalCompressed: number;
  fileCount: number;
  outputPath: string;
}

export interface SingleCompressResult {
  originalSize: number;
  compressedSize: number;
  outputPath: string;
  posterPath: string | null;
}

export type AppStatus = 'idle' | 'scanning' | 'ready' | 'compressing' | 'done';
export type InputMode = 'folder' | 'file';

export interface CompressOptions {
  imageToWebp: boolean;
  generatePoster: boolean;
}
