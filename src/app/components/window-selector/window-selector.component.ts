import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaptureService, WindowInfo } from '../../services/capture.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-window-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './window-selector.component.html',
  styleUrl: './window-selector.component.css'
})
export class WindowSelectorComponent {
  private captureService = inject(CaptureService);

  windows = signal<WindowInfo[]>([]);
  selectedWindowId = signal<string>('');

  @Output() windowSelected = new EventEmitter<string>();

  async ngOnInit() {
    await this.refreshWindows();
  }

  async refreshWindows() {
    try {
      const wins = await this.captureService.getWindows();
      this.windows.set(wins);
      if (wins.length > 0 && !this.selectedWindowId()) {
        this.selectedWindowId.set(wins[0].id);
        this.onSelectionChange();
      }
    } catch (error) {
      console.error('Failed to load windows', error);
    }
  }

  onSelectionChange() {
    this.windowSelected.emit(this.selectedWindowId());
  }
}
