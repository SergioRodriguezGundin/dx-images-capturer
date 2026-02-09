import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-folder-to-save',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './folder-to-save.component.html',
  styleUrl: './folder-to-save.component.css'
})
export class FolderToSaveComponent {
  disabled = input(false);

  folderName = signal('');

  folderNameChange = output<string>();

  onFolderNameChange(value: string) {
    this.folderName.set(value);
    this.folderNameChange.emit(value);
  }
}
