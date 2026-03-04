/**
 * Prevent errors in ng test due to uninitialized log.
 * Since we don't need to actually log in the test environment,
 * we use vi.mock here to mock the electron-log module,
 * providing empty implementations.
 */

vi.mock('electron-log/renderer', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
  return {
    ...mockLogger,
    default: mockLogger
  };
});

vi.mock('electron-log/main', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
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
