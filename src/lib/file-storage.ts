import { AudioFile } from '@/types/audio';

// In-memory storage for demo - in production, use database
const filesStorage = new Map<string, AudioFile>();

export function getFileById(id: string): AudioFile | undefined {
  return filesStorage.get(id);
}

export function getAllFiles(): AudioFile[] {
  return Array.from(filesStorage.values());
}

export function saveFile(file: AudioFile): void {
  filesStorage.set(file.id, file);
}

export function updateFile(id: string, updates: Partial<AudioFile>): AudioFile | null {
  const existing = filesStorage.get(id);
  if (existing) {
    const updated = { ...existing, ...updates };
    filesStorage.set(id, updated);
    return updated;
  }
  return null;
}

export function deleteFile(id: string): boolean {
  return filesStorage.delete(id);
}