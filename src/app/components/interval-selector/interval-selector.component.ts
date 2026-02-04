import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interval-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './interval-selector.component.html',
  styleUrl: './interval-selector.component.css'
})
export class IntervalSelectorComponent {
  interval = signal<number>(1000);

  @Output() intervalChange = new EventEmitter<number>();

  onIntervalChange() {
    this.intervalChange.emit(this.interval());
  }

  ngOnInit() {
    // Emit initial value
    this.onIntervalChange();
  }
}
