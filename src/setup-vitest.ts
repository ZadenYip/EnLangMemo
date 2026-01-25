/**
 * Prevent errors in ng test due to uninitialized log.
 * Since we don't need to actually log in the test environment,
 * we use vi.mock here to mock the electron-log module,
 * providing empty implementations.
 */



vi.mock('electron-log/renderer', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('electron-log/main', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

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
