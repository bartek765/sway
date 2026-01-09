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
    <div class="sway-form"
         [class.sway-shake]="isShaking()"
         [class.sway-forward]="currentDirection() === 'forward'"
         [class.sway-backward]="currentDirection() === 'backward'">

      @if (config().showProgress) {
        <div class="sway-progress" role="progressbar" [attr.aria-valuenow]="progress()">
          <div class="sway-progress-bar" [style.width.%]="progress()"></div>
        </div>
      }

      <div #stepsContainer class="sway-steps-container" [style.view-transition-name]="viewTransitionName()">
        <ng-content></ng-content>
      </div>

      @if (config().showNavigation) {
        <div class="sway-navigation">
          <button type="button" class="sway-button-previous" [disabled]="!hasPrevious()" (click)="previous()">Previous
          </button>
          @if (hasNext()) {
            <button type="button" class="sway-button-next" (click)="next()">Next</button>
          } @else {
            <button type="button" class="sway-button-submit" (click)="submit()">Submit</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sway-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #ffffff;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }

    .sway-steps-container {
      display: grid;
      grid-template-rows: 1fr;
      overflow: hidden;
      position: relative;
      contain: paint;
    }

    .sway-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      position: relative;
      z-index: 10;
    }

    .sway-progress {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .sway-progress-bar {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
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
