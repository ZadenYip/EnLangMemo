/**
 * 防止 ng test 下因为没初始化 log 而报错的问题
 * 因为在测试环境下，我们并不需要真正记录日志，
 * 所以这里我们用 vi.mock 来模拟 electron-log 模块，
 * 并提供空的实现。
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

  Object.defineProperty(globalThis.window, 'bridge', {
    value: {
      database: {
        ipcRunSQL: vi.fn(),
      },
    },
    writable: true,
  });
})();
