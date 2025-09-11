// TypeScript interfaces for audio processing application

export interface AudioFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  duration?: number;
  uploadedAt: Date;
  status: ProcessingStatus;
  progress: number;
  voiceTrackUrl?: string;
  musicTrackUrl?: string;
  error?: string;
}

export enum ProcessingStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DOWNLOADING = 'downloading'
}

export interface ProcessingJob {
  id: string;
  fileId: string;
  status: ProcessingStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  qualityLevel: QualityLevel;
}

export enum QualityLevel {
  FAST = 'fast',
  STANDARD = 'standard',
  HIGH = 'high'
}

export interface SeparationResult {
  success: boolean;
  voiceTrackPath?: string;
  musicTrackPath?: string;
  error?: string;
  processingTime: number;
}

export interface UploadResponse {
  success: boolean;
  fileId?: string;
  error?: string;
  file?: AudioFile;
}

export interface ProcessingResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  estimatedTime?: number;
}

export interface StatusResponse {
  success: boolean;
  job?: ProcessingJob;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  expiresAt?: Date;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}

export interface ProcessingStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  averageProcessingTime: number;
}