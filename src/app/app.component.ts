import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowSelectorComponent } from './components/window-selector/window-selector.component';
import { IntervalSelectorComponent } from './components/interval-selector/interval-selector.component';
import { ControlsComponent } from './components/controls/controls.component';
import { CaptureService } from './services/capture.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, WindowSelectorComponent, IntervalSelectorComponent, ControlsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  captureService = inject(CaptureService);

  selectedWindowId = signal<string>('');
  captureInterval = signal<number>(1000);
  baseCapturePath = signal<string>('');

  async ngOnInit() {
    try {
      const path = await this.captureService.getCapturePath();
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
      await this.captureService.startCapture(this.selectedWindowId(), this.captureInterval());
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
      await this.captureService.startRecord(this.selectedWindowId());
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
