/**
 * Prevent errors in ng test due to uninitialized log.
 * Since we don't need to actually log in the test environment,
 * we use vi.mock here to mock the electron-log module,
 * providing empty implementations.
 */

vi.mock('electron-log/renderer', () => {
  const mockLogger = {
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  };
  return {
    ...mockLogger,
    default: mockLogger
  };
});

vi.mock('electron-log/main', () => {
  const mockLogger = {
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  };
  return {
    ...mockLogger,
    default: mockLogger
  };
});

(function defineGlobalWindow() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {} as any;
  }

  Object.defineProperty(globalThis.window, 'service', {
    value: {
      database: {
        runSQL: vi.fn(),
      },
    },
    writable: true,
  });
})();
