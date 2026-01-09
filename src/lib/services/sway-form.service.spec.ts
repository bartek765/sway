import { describe, it, expect, beforeEach } from 'vitest';
import { SwayFormService } from './sway-form.service';
import { SwayStepId } from '../models/sway.types';

describe('SwayFormService', () => {
  let service: SwayFormService;

  beforeEach(() => {
    service = new SwayFormService();
  });

  describe('Step Registration', () => {
    it('should register a step', () => {
      service.registerStep('step1', 0, 'Step 1');

      expect(service.totalSteps()).toBe(1);
      expect(service.currentStepId()).toBe('step1');
    });

    it('should register multiple steps in order', () => {
      service.registerStep('step1', 0, 'Step 1');
      service.registerStep('step2', 1, 'Step 2');
      service.registerStep('step3', 2, 'Step 3');

      expect(service.totalSteps()).toBe(3);
    });

    it('should activate first step automatically', () => {
      service.registerStep('first', 0);

      expect(service.currentStepId()).toBe('first');
      expect(service.currentStepIndex()).toBe(0);
    });

    it('should track step metadata', () => {
      service.registerStep('step1', 0, 'My Step');

      const metadata = service.getStepMetadata('step1');
      expect(metadata).toBeDefined();
      expect(metadata?.title).toBe('My Step');
      expect(metadata?.index).toBe(0);
      expect(metadata?.isActive).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      service.registerStep('step1', 0, 'Step 1');
      service.registerStep('step2', 1, 'Step 2');
      service.registerStep('step3', 2, 'Step 3');
    });

    it('should navigate to next step', () => {
      const result = service.next();

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step2');
      expect(service.currentStepIndex()).toBe(1);
    });

    it('should navigate to previous step', () => {
      service.next(); // Go to step2
      const result = service.previous();

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step1');
      expect(service.currentStepIndex()).toBe(0);
    });

    it('should navigate to specific step', () => {
      const result = service.goToStep('step3');

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step3');
      expect(service.currentStepIndex()).toBe(2);
    });

    it('should not navigate beyond last step', () => {
      service.goToStep('step3');
      const result = service.next();

      expect(result).toBe(false);
      expect(service.currentStepId()).toBe('step3');
    });

    it('should not navigate before first step', () => {
      const result = service.previous();

      expect(result).toBe(false);
      expect(service.currentStepId()).toBe('step1');
    });

    it('should return false for non-existent step', () => {
      const result = service.goToStep('invalid-step' as SwayStepId);

      expect(result).toBe(false);
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);
      service.registerStep('step3', 2);
    });

    it('should calculate progress correctly', () => {
      expect(service.progress()).toBeCloseTo(33.33, 1); // Step 1 of 3

      service.next();
      expect(service.progress()).toBeCloseTo(66.66, 1); // Step 2 of 3

      service.next();
      expect(service.progress()).toBe(100); // Step 3 of 3
    });

    it('should track hasNext correctly', () => {
      expect(service.hasNext()).toBe(true);

      service.goToStep('step3');
      expect(service.hasNext()).toBe(false);
    });

    it('should track hasPrevious correctly', () => {
      expect(service.hasPrevious()).toBe(false);

      service.next();
      expect(service.hasPrevious()).toBe(true);
    });

    it('should track isComplete correctly', () => {
      expect(service.isComplete()).toBe(false);

      service.goToStep('step3');
      service.setStepValidity('step3', true);
      expect(service.isComplete()).toBe(true);
    });
  });

  describe('History Tracking', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);
      service.registerStep('step3', 2);
    });

    it('should record navigation events', () => {
      service.next(); // step1 → step2

      const history = service.history();
      expect(history.length).toBe(1);
      expect(history[0].from).toBe('step1');
      expect(history[0].to).toBe('step2');
      expect(history[0].direction).toBe('forward');
    });

    it('should track backward navigation', () => {
      service.next(); // step1 → step2
      service.previous(); // step2 → step1

      const history = service.history();
      expect(history.length).toBe(2);
      expect(history[1].direction).toBe('backward');
    });

    it('should include timestamps', () => {
      const before = Date.now();
      service.next();
      const after = Date.now();

      const history = service.history();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Step Metadata Management', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
    });

    it('should update step validity', () => {
      service.setStepValidity('step1', true);

      const metadata = service.getStepMetadata('step1');
      expect(metadata?.isValid).toBe(true);
    });

    it('should track visited steps', () => {
      service.registerStep('step2', 1);

      let metadata = service.getStepMetadata('step2');
      expect(metadata?.isVisited).toBe(false);

      service.next();
      metadata = service.getStepMetadata('step2');
      expect(metadata?.isVisited).toBe(true);
    });

    it('should update step metadata partially', () => {
      service.updateStepMetadata('step1', { isValid: true });

      const metadata = service.getStepMetadata('step1');
      expect(metadata?.isValid).toBe(true);
      expect(metadata?.isActive).toBe(true); // Other properties unchanged
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);
      service.registerStep('step3', 2);
    });

    it('should reset to initial state', () => {
      service.next();
      service.next();
      service.setStepValidity('step3', true);

      service.reset();

      expect(service.currentStepId()).toBe('step1');
      expect(service.currentStepIndex()).toBe(0);
      expect(service.history().length).toBe(0);
    });

    it('should reset all step metadata', () => {
      service.next();
      service.setStepValidity('step2', true);

      service.reset();

      const metadata = service.getStepMetadata('step2');
      expect(metadata?.isValid).toBe(false);
      expect(metadata?.isVisited).toBe(false);
      expect(metadata?.isActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty form', () => {
      expect(service.totalSteps()).toBe(0);
      expect(service.currentStepId()).toBe(null);
      expect(service.progress()).toBe(0);
    });

    it('should handle single step', () => {
      service.registerStep('only', 0);

      expect(service.hasNext()).toBe(false);
      expect(service.hasPrevious()).toBe(false);
      expect(service.progress()).toBe(100);
    });

    it('should handle unregister step', () => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);

      service.unregisterStep('step2');

      expect(service.totalSteps()).toBe(1);
      expect(service.getStepMetadata('step2')).toBeUndefined();
    });
  });

  describe('Conditional Navigation', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);
      service.registerStep('step3', 2);
    });

    it('should compute canNavigateNext based on validity', () => {
      expect(service.canNavigateNext()).toBe(false); // step1 not valid by default

      service.setStepValidity('step1', true);
      expect(service.canNavigateNext()).toBe(true);
    });

    it('should block navigation when force=false and step is invalid', () => {
      service.setStepValidity('step1', false);

      const result = service.next(false);

      expect(result).toBe(false);
      expect(service.currentStepId()).toBe('step1'); // Still on step1
    });

    it('should allow navigation when force=false and step is valid', () => {
      service.setStepValidity('step1', true);

      const result = service.next(false);

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step2');
    });

    it('should force navigation when force=true regardless of validity', () => {
      service.setStepValidity('step1', false);

      const result = service.next(true);

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step2');
    });

    it('should use force=true by default', () => {
      service.setStepValidity('step1', false);

      const result = service.next(); // No parameter = force=true

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step2');
    });
  });

  describe('Async Validation', () => {
    beforeEach(() => {
      service.registerStep('step1', 0);
      service.registerStep('step2', 1);
    });

    it('should validateAndNext return false when step is invalid', async () => {
      service.setStepValidity('step1', false);

      const result = await service.validateAndNext();

      expect(result).toBe(false);
      expect(service.currentStepId()).toBe('step1');
    });

    it('should validateAndNext return true and navigate when step is valid', async () => {
      service.setStepValidity('step1', true);

      const result = await service.validateAndNext();

      expect(result).toBe(true);
      expect(service.currentStepId()).toBe('step2');
    });
  });
});
