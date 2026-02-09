import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowSelectorComponent } from './components/window-selector/window-selector.component';
import { IntervalSelectorComponent } from './components/interval-selector/interval-selector.component';
import { FolderToSaveComponent } from './components/folder-to-save/folder-to-save.component';
import { ControlsComponent } from './components/controls/controls.component';
import { CaptureService } from './services/capture.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, WindowSelectorComponent, IntervalSelectorComponent, FolderToSaveComponent, ControlsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  captureService = inject(CaptureService);

  selectedWindowId = signal<string>('');
  captureInterval = signal<number>(1000);
  subfolderName = signal<string>('');
  baseCapturePath = signal<string>('');

  constructor() {
    // Update the displayed path whenever the subfolder name changes
    effect(() => {
      const subfolder = this.subfolderName();
      this.updateCapturePath(subfolder);
    });
  }

  private async updateCapturePath(subfolder: string) {
    try {
      const path = await this.captureService.getCapturePath(subfolder || undefined);
      this.baseCapturePath.set(path);
    } catch (error) {
      console.error('Failed to get capture path', error);
    }
  }

  async onStart() {
    if (!this.selectedWindowId()) {
      alert('Please select a window first');
      return;
    }
    try {
      const subfolder = this.subfolderName().trim() || undefined;
      await this.captureService.startCapture(this.selectedWindowId(), this.captureInterval(), subfolder);
    } catch (error) {
      console.error('Failed to start capture', error);
      alert('Failed to start capture: ' + error);
    }
  }

  async onStop() {
    try {
      await this.captureService.stopCapture();
    } catch (error) {
      console.error('Failed to stop capture', error);
    }
  }

  async onRecordStart() {
    if (!this.selectedWindowId()) {
      alert('Please select a window first');
      return;
    }
    try {
      const subfolder = this.subfolderName().trim() || undefined;
      await this.captureService.startRecord(this.selectedWindowId(), subfolder);
    } catch (error) {
      console.error('Failed to start recording', error);
      alert('Failed to start recording: ' + error);
    }
  }

  async onRecordStop() {
    try {
      await this.captureService.stopRecord();
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }
}
