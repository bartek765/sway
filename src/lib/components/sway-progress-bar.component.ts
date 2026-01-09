import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwayFormService } from '../services/sway-form.service';

@Component({
  selector: 'sway-progress-bar',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sway-progress-track">
      <div
        class="sway-progress-fill"
        [style.width.%]="progress()"
        style="view-transition-name: sway-progress-fill;">
      </div>
    </div>
  `,
  styles: [`
    .sway-progress-track {
      width: 100%;
      height: 4px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .sway-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--sway-primary-color, #3b82f6), #60a5fa);
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
      transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    ::view-transition-group(sway-progress-fill) {
      animation-duration: 500ms;
      animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `]
})
export class SwayProgressBarComponent {
  private readonly formService = inject(SwayFormService);
  readonly progress = this.formService.progress;
}
