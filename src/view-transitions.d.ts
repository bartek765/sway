/**
 * TypeScript declarations for View Transitions API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */

interface ViewTransition {
  /**
   * A Promise that fulfills once the transition animation is finished
   */
  finished: Promise<void>;

  /**
   * A Promise that fulfills once the pseudo-element tree is created
   */
  ready: Promise<void>;

  /**
   * A Promise that fulfills when the transition is ready to run
   */
  updateCallbackDone: Promise<void>;

  /**
   * Skips the animation part of the view transition
   */
  skipTransition(): void;
}

interface Document {
  /**
   * Starts a new view transition
   * @param callback - The callback that updates the DOM
   * @returns A ViewTransition object
   */
  startViewTransition(callback?: () => void | Promise<void>): ViewTransition;
}

