/**
 * SwayStepDirective - Structural directive for defining form steps
 * @packageDocumentation
 */

import {
  AfterContentInit,
  ContentChild,
  Directive,
  effect,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {FormGroupDirective, NgForm} from '@angular/forms';
import {SwayStepId} from '../models/sway.types';
import type {SwayFormService} from '../services/sway-form.service';

/**
 * Context provided to step template
 */
export interface SwayStepContext {
  $implicit: boolean;
  index: number;
  total: number;
  first: boolean;
  last: boolean;
}

@Directive({
  selector: '[swayStep]',
  standalone: true,
})
export class SwayStepDirective implements OnInit, AfterContentInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef<SwayStepContext>);
  private readonly viewContainerRef = inject(ViewContainerRef);

  @ContentChild(NgForm) ngForm?: NgForm;
  @ContentChild(FormGroupDirective) formGroupDirective?: FormGroupDirective;

  formService?: SwayFormService;

  @Input({required: true}) swayStep!: SwayStepId;
  @Input() swayStepTitle?: string;
  @Input() swayStepTransitionName?: string;

  readonly isActive = signal(false);
  readonly isVisited = signal(false);

  index = 0;
  total = 0;

  private context: SwayStepContext = {
    $implicit: false,
    index: 0,
    total: 0,
    first: false,
    last: false,
  };

  constructor() {
    effect(() => {
      const active = this.isActive();
      this.context.$implicit = active;

      if (active) {
        this.render();
        if (!this.isVisited()) {
          this.isVisited.set(true);
        }
      } else {
        this.clear();
      }
    });
  }

  ngOnInit(): void {
    this.updateContext();
  }

  ngAfterContentInit(): void {
    this.setupFormValidationSync();
  }

  ngOnDestroy(): void {
    this.viewContainerRef.clear();
  }

  private setupFormValidationSync(): void {
    if (this.ngForm) {
      this.syncWithForm(this.ngForm);
    } else if (this.formGroupDirective) {
      this.syncWithForm(this.formGroupDirective);
    }
  }

  private syncWithForm(form: NgForm | FormGroupDirective): void {
    if (!this.formService) return;

    this.updateStepValidity(form.valid ?? false);

    form.statusChanges?.subscribe(() => {
      this.updateStepValidity(form.valid ?? false);
    });
  }

  private updateStepValidity(isValid: boolean): void {
    if (this.formService) {
      this.formService.setStepValidity(this.id, isValid);
    }
  }

  updateContext(): void {
    this.context.index = this.index;
    this.context.total = this.total;
    this.context.first = this.index === 0;
    this.context.last = this.index === this.total - 1;
  }

  private render(): void {
    if (this.viewContainerRef.length === 0) {
      this.viewContainerRef.createEmbeddedView(this.templateRef, this.context);
    }
  }

  clear(): void {
    this.viewContainerRef.clear();
  }

  get id(): SwayStepId {
    return this.swayStep;
  }

  get title(): string | undefined {
    return this.swayStepTitle;
  }
}
