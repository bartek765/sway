/**
 * Interface for step components
 * @packageDocumentation
 */

import { Signal } from '@angular/core';
import { SwayStepId, SwayValidationResult } from './sway.types';

/**
 * Interface that step components can implement for advanced features
 */
export interface SwayStep {
  /**
   * Step identifier
   */
  readonly id: SwayStepId;

  /**
   * Step title (for navigation/progress)
   */
  readonly title?: Signal<string>;

  /**
   * Validate step before navigation
   * @returns Validation result or Promise of validation result
   */
  validate?(): SwayValidationResult | Promise<SwayValidationResult>;

  /**
   * Called when step becomes active
   */
  onEnter?(): void | Promise<void>;

  /**
   * Called when step becomes inactive
   */
  onExit?(): void | Promise<void>;

  /**
   * Can user navigate away from this step?
   */
  canExit?(): boolean | Promise<boolean>;
}

