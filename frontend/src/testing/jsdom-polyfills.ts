/**
 * Browser APIs the app relies on that jsdom does not implement. Each stub is inert: it only
 * exists so production code can run, never to simulate behaviour a test asserts on.
 */

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => [];
}

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => undefined;
}
