/**
 * SwayFormService - State management for multi-step forms using Signals
 * @packageDocumentation
 */

import { Injectable, signal, computed } from '@angular/core';
import {
  SwayStepId,
  SwayDirection,
  SwayNavigationEvent,
  SwayStepMetadata,
} from '../models/sway.types';

/**
 * Service managing the state of a Sway form instance
 * Uses Angular Signals for reactive state management
 */
@Injectable()
export class SwayFormService {
  /**
   * Current active step ID
   */
  private readonly _currentStepId = signal<SwayStepId | null>(null);

  /**
   * Map of step IDs to their metadata
   */
  private readonly _stepsMetadata = signal<Map<SwayStepId, SwayStepMetadata>>(new Map());

  /**
   * Ordered list of step IDs
   */
  private readonly _stepOrder = signal<SwayStepId[]>([]);

  /**
   * Navigation history
   */
  private readonly _history = signal<SwayNavigationEvent[]>([]);

  /**
   * Public read-only current step ID
   */
  readonly currentStepId = this._currentStepId.asReadonly();

  /**
   * Current step index (0-based)
   */
  readonly currentStepIndex = computed(() => {
    const stepId = this._currentStepId();
    if (stepId === null) return -1;
    return this._stepOrder().indexOf(stepId);
  });

  /**
   * Total number of steps
   */
  readonly totalSteps = computed(() => this._stepOrder().length);

  /**
   * Current step metadata
   */
  readonly currentStepMetadata = computed(() => {
    const stepId = this._currentStepId();
    if (stepId === null) return null;
    return this._stepsMetadata().get(stepId) ?? null;
  });

  /**
   * Whether there is a previous step
   */
  readonly hasPrevious = computed(() => this.currentStepIndex() > 0);

  /**
   * Whether there is a next step
   */
  readonly hasNext = computed(() => {
    const current = this.currentStepIndex();
    const total = this.totalSteps();
    return current >= 0 && current < total - 1;
  });

  /**
   * Progress percentage (0-100)
   */
  readonly progress = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return 0;
    const current = this.currentStepIndex();
    return ((current + 1) / total) * 100;
  });

  /**
   * Whether the form is complete (on last step and valid)
   */
  readonly isComplete = computed(() => {
    const current = this.currentStepIndex();
    const total = this.totalSteps();
    const metadata = this.currentStepMetadata();
    return current === total - 1 && metadata?.isValid === true;
  });

  /**
   * Whether navigation to next step is allowed (current step is valid)
   */
  readonly canNavigateNext = computed(() => {
    const metadata = this.currentStepMetadata();
    return metadata?.isValid === true;
  });

  /**
   * Navigation history (read-only)
   */
  readonly history = this._history.asReadonly();

  /**
   * Register a step
   */
  registerStep(id: SwayStepId, index: number, title?: string): void {
    this._stepsMetadata.update((map) => {
      const newMap = new Map(map);
      newMap.set(id, {
        id,
        index,
        title,
        isValid: true,
        isVisited: false,
        isActive: false,
      });
      return newMap;
    });

    this._stepOrder.update((order) => {
      const newOrder = [...order];
      newOrder[index] = id;
      return newOrder;
    });

    // Set first step as active if no step is active
    if (this._currentStepId() === null && index === 0) {
      this.goToStep(id);
    }
  }

  /**
   * Unregister a step
   */
  unregisterStep(id: SwayStepId): void {
    this._stepsMetadata.update((map) => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });

    this._stepOrder.update((order) => order.filter((stepId) => stepId !== id));
  }

  /**
   * Navigate to a specific step
   */
  goToStep(stepId: SwayStepId): boolean {
    const currentId = this._currentStepId();
    if (currentId === stepId) return true;

    const stepExists = this._stepsMetadata().has(stepId);
    if (!stepExists) return false;

    const currentIndex = currentId ? this._stepOrder().indexOf(currentId) : -1;
    const targetIndex = this._stepOrder().indexOf(stepId);
    const direction: SwayDirection = targetIndex > currentIndex ? 'forward' : 'backward';

    // Update current step to inactive
    if (currentId !== null) {
      this.updateStepMetadata(currentId, { isActive: false });
    }

    // Update new step to active
    this.updateStepMetadata(stepId, { isActive: true, isVisited: true });

    // Update current step
    this._currentStepId.set(stepId);

    // Record navigation event
    if (currentId !== null) {
      this._history.update((history) => [
        ...history,
        {
          from: currentId,
          to: stepId,
          direction,
          timestamp: Date.now(),
        },
      ]);
    }

    return true;
  }

  /**
   * Navigate to next step
   * @param force - If false, navigation is blocked if current step is invalid
   * @returns true if navigation succeeded, false otherwise
   */
  next(force = true): boolean {
    if (!this.hasNext()) return false;

    // Check validity if not forcing navigation
    if (!force && !this.canNavigateNext()) {
      return false;
    }

    const nextIndex = this.currentStepIndex() + 1;
    const nextStepId = this._stepOrder()[nextIndex];
    return this.goToStep(nextStepId);
  }

  /**
   * Navigate to previous step
   */
  previous(): boolean {
    if (!this.hasPrevious()) return false;
    const prevIndex = this.currentStepIndex() - 1;
    const prevStepId = this._stepOrder()[prevIndex];
    return this.goToStep(prevStepId);
  }

  /**
   * Validate current step and navigate to next if valid
   * @returns Promise<boolean> - true if validation passed and navigation succeeded
   */
  async validateAndNext(): Promise<boolean> {
    // For now, uses synchronous validation
    // This will be extended to support async validation in the future
    if (!this.canNavigateNext()) {
      return false;
    }

    return this.next(true);
  }

  /**
   * Update step metadata
   */
  updateStepMetadata(id: SwayStepId, updates: Partial<SwayStepMetadata>): void {
    this._stepsMetadata.update((map) => {
      const newMap = new Map(map);
      const current = newMap.get(id);
      if (current) {
        newMap.set(id, { ...current, ...updates });
      }
      return newMap;
    });
  }

  /**
   * Mark step as valid/invalid
   */
  setStepValidity(id: SwayStepId, valid: boolean): void {
    this.updateStepMetadata(id, { isValid: valid });
  }

  /**
   * Get step metadata by ID
   */
  getStepMetadata(id: SwayStepId): SwayStepMetadata | undefined {
    return this._stepsMetadata().get(id);
  }

  /**
   * Reset the form to initial state
   */
  reset(): void {
    const firstStepId = this._stepOrder()[0];

    this._stepsMetadata.update((map) => {
      const newMap = new Map(map);
      newMap.forEach((metadata) => {
        metadata.isValid = false;
        metadata.isVisited = metadata.id === firstStepId;
        metadata.isActive = metadata.id === firstStepId;
      });
      return newMap;
    });

    this._currentStepId.set(firstStepId ?? null);
    this._history.set([]);
  }
}

