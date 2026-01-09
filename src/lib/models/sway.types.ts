export type SwayStepId = string | number;
export type SwayDirection = 'forward' | 'backward';

export interface SwayValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export interface SwayStepMetadata {
  id: SwayStepId;
  index: number;
  title?: string;
  isValid: boolean;
  isVisited: boolean;
  isActive: boolean;
}

export interface SwayNavigationEvent {
  from: SwayStepId;
  to: SwayStepId;
  direction: SwayDirection;
  timestamp: number;
}

export interface SwayTransitionConfig {
  duration?: number;
  easing?: string;
  type?: 'slide' | 'fade' | 'morph';
}

export interface SwayFormConfig {
  linear?: boolean;
  showNavigation?: boolean;
  showProgress?: boolean;
  transition?: SwayTransitionConfig;
  enableViewTransitions?: boolean;
  cssPrefix?: string;
}
