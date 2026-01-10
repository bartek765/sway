import {
  AfterContentInit,
  Component,
  computed,
  ContentChildren,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  QueryList,
  signal,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SwayStepDirective} from '../directives/sway-step.directive';
import {SwayFormService} from '../services/sway-form.service';
import {SwayFormConfig, SwayNavigationEvent} from '../models/sway.types';

@Component({
  selector: 'sway-form',
  standalone: true,
  imports: [CommonModule],
  providers: [SwayFormService],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sway-form glass-card"
         [class.sway-shake]="isShaking()"
         [class.sway-forward]="currentDirection() === 'forward'"
         [class.sway-backward]="currentDirection() === 'backward'">

      @if (config().showProgress) {
        <div class="sway-progress-wrapper">
          <div class="sway-progress" role="progressbar" [attr.aria-valuenow]="progress()">
            <div class="sway-progress-bar" [style.width.%]="progress()">
              <div class="sway-progress-glow"></div>
            </div>
          </div>
        </div>
      }

      <div #stepsContainer class="sway-steps-container" [style.view-transition-name]="viewTransitionName()">
        <ng-content></ng-content>
      </div>

      @if (config().showNavigation) {
        <div class="sway-navigation">
          <button type="button" class="sway-button-previous" [disabled]="!hasPrevious()" (click)="previous()">
            <span class="button-icon">‹</span>
            Previous
          </button>
          @if (hasNext()) {
            <button type="button" class="sway-button-next" (click)="next()">
              Next
              <span class="button-icon">›</span>
            </button>
          } @else {
            <button type="button" class="sway-button-submit" (click)="submit()">
              Submit
              <span class="button-icon">›</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
      border-radius: 1.5rem;
      overflow: hidden;
      animation: fadeIn 0.5s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .sway-form {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .sway-progress-wrapper {
      padding: 2rem 2rem 1rem 2rem;
    }

    .sway-progress {
      height: 0.375rem;
      background: rgb(30, 41, 59);
      border-radius: 9999px;
      overflow: hidden;
    }

    .sway-progress-bar {
      height: 100%;
      background: #06B6D4;
      border-radius: 9999px;
      transition: width 0.3s ease;
      position: relative;
    }

    .sway-progress-glow {
      position: absolute;
      inset: 0;
      background: #06B6D4;
      opacity: 0.5;
      filter: blur(4px);
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
    }

    .sway-steps-container {
      padding: 1rem 2rem 2rem 2rem;
      display: grid;
      grid-template-rows: 1fr;
      overflow: clip;
      position: relative;
      contain: layout paint;
    }

    .sway-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem 2rem 2rem;
      position: relative;
      z-index: 10;
    }

    .sway-button-previous {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgb(100, 116, 139);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.3s ease;
      padding: 0.5rem;
    }

    .sway-button-previous:hover:not(:disabled) {
      color: rgb(203, 213, 225);
    }

    .sway-button-previous:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .sway-button-next,
    .sway-button-submit {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: linear-gradient(to right, #06B6D4, #3B82F6);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 0.75rem;
      font-weight: 700;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
      transition: all 0.3s ease;
    }

    .sway-button-next:hover,
    .sway-button-submit:hover {
      background: linear-gradient(to right, #0EA5E9, #2563EB);
      transform: scale(0.98);
    }

    .sway-button-next:active,
    .sway-button-submit:active {
      transform: scale(0.95);
    }

    .button-icon {
      font-size: 1.125rem;
      line-height: 1;
    }

    .sway-shake {
      animation: sway-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    @keyframes sway-shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-8px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(8px);
      }
    }
  `]
})
export class SwayFormComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(SwayStepDirective) steps!: QueryList<SwayStepDirective>;
  @ViewChild('stepsContainer', {read: ElementRef}) stepsContainer?: ElementRef<HTMLDivElement>;

  @Input({alias: 'config'}) set configInput(value: SwayFormConfig) {
    this._config.set({...this.getDefaultConfig(), ...value});
  }

  @Output() stepChange = new EventEmitter<SwayNavigationEvent>();
  @Output() formSubmit = new EventEmitter<void>();

  private readonly formService = inject(SwayFormService);
  private readonly _config = signal<SwayFormConfig>(this.getDefaultConfig());
  public readonly config = this._config.asReadonly();

  readonly currentStepId = computed(() => this.formService.currentStepId());
  readonly progress = computed(() => this.formService.progress());
  readonly hasPrevious = computed(() => this.formService.hasPrevious());
  readonly hasNext = computed(() => this.formService.hasNext());
  readonly isShaking = signal(false);
  readonly currentDirection = signal<'forward' | 'backward'>('forward');

  readonly viewTransitionName = computed(() =>
    this.config().enableViewTransitions ? 'sway-form-container' : ''
  );

  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const currentId = this.currentStepId();
      if (this.steps) {
        this.steps.forEach(step => step.isActive.set(step.id === currentId));
      }
    });
  }

  ngAfterContentInit() {
    this.initializeSteps();
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private initializeSteps() {
    this.steps.forEach((step, i) => {
      step.index = i;
      step.total = this.steps.length;
      step.formService = this.formService;
      step.updateContext();
      this.formService.registerStep(step.id, i, step.title);
    });
    const firstId = this.steps.first?.id;
    if (firstId) this.formService.goToStep(firstId);
  }

  private setupResizeObserver() {
    if (!this.stepsContainer) return;
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) this.stepsContainer!.nativeElement.style.gridTemplateRows = `${h}px`;
      }
    });
    this.resizeObserver.observe(this.stepsContainer.nativeElement);
  }

  next() {
    if (!this.formService.canNavigateNext()) {
      this.shake();
      return;
    }
    this.navigate('forward', () => this.formService.next());
  }

  previous() {
    this.navigate('backward', () => this.formService.previous());
  }

  private navigate(direction: 'forward' | 'backward', action: () => void) {
    if ('startViewTransition' in document) {
      const transition = (document as any).startViewTransition(() => {
        this.currentDirection.set(direction);
        action();
      });
    } else {
      this.currentDirection.set(direction);
      action();
    }
  }

  submit() {
    this.formSubmit.emit();
  }

  shake() {
    this.isShaking.set(true);
    setTimeout(() => this.isShaking.set(false), 500);
  }

  private getDefaultConfig(): SwayFormConfig {
    return {showNavigation: true, showProgress: true, enableViewTransitions: true};
  }
}
