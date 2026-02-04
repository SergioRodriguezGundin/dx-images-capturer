import { Injectable, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface WindowInfo {
  id: string;
  title: string;
  app_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaptureService {
  isCapturing = signal(false);
  isRecording = signal(false);
  lastCapturePath = signal<string | null>(null);

  constructor() {
    this.setupListeners();
  }

  private async setupListeners() {
    await listen<string>('capture-taken', (event) => {
      this.lastCapturePath.set(event.payload);
    });

    await listen('recording-started', () => {
      this.isRecording.set(true);
    });

    await listen('recording-stopped', () => {
      this.isRecording.set(false);
    });
  }

  async getWindows(): Promise<WindowInfo[]> {
    return await invoke<WindowInfo[]>('get_windows');
  }

  async getCapturePath(): Promise<string> {
    return await invoke('get_capture_path');
  }

  async startCapture(windowId: string, intervalMs: number): Promise<void> {
    await invoke('start_capture', { windowId, intervalMs });
    this.isCapturing.set(true);
  }

  async stopCapture(): Promise<void> {
    await invoke('stop_capture');
    this.isCapturing.set(false);
  }

  async startRecord(windowId: string): Promise<void> {
    await invoke('start_record', { windowId });
    // isRecording is set by the event listener, but we can optimistically set it or wait for event
  }

  async stopRecord(): Promise<void> {
    await invoke('stop_record');
  }
}
