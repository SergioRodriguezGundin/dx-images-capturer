import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowSelectorComponent } from './window-selector.component';

describe('WindowSelectorComponent', () => {
  let component: WindowSelectorComponent;
  let fixture: ComponentFixture<WindowSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindowSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindowSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
