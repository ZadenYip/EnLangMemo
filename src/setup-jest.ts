import Database from 'better-sqlite3';
import { createDeckSQL } from '../app/database/database';

/**
 * 防止 ng test 下因为没初始化 log 而报错的问题
 * 因为在测试环境下，我们并不需要真正记录日志，
 * 所以这里我们用 jest.mock 来模拟 electron-log 模块，
 * 并提供空的实现。
 */

jest.mock(
    'electron-log/renderer', () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    })
)

jest.mock(
    'electron-log/main', () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    })
)

Object.defineProperty(window, 'bridge', {
  value: {
    database: {
      ipcRunSQL: jest.fn()
    },
  },
  writable: true,
});


export let db: Database.Database | null = null;
beforeAll(() => {
    db = new Database(':memory:');
    db.exec(createDeckSQL);
});

afterAll(() => {
    if (db !== null) {
        db.close();
    }
});