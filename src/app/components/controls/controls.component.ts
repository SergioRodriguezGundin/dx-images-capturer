import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-controls',
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.css'
})
export class ControlsComponent {
  isCapturing = input<boolean>(false);
  isRecording = input<boolean>(false);
  start = output<void>();
  stop = output<void>();
  startRecord = output<void>();
  stopRecord = output<void>();
}
