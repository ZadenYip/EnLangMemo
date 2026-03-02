# AGENT Guide - SRS English Reader (Angular + Electron)

## 1. 目标与技术栈
- 项目类型: 桌面应用（Angular 渲染进程 + Electron 主进程）
- 前端: Angular 21, TypeScript, SCSS, Angular Material
- 桌面层: Electron 39
- Node 能力: better-sqlite3, 文件系统, 日志
- 测试: Vitest（Angular + Electron 单测）, Playwright（E2E）

## 2. 目录职责
- `src/`: Angular 渲染进程（页面、组件、前端服务）
- `app/`: Electron 主进程与 Node 服务
- `app/main.ts`: Electron 应用入口，窗口初始化、数据库初始化、IPC 注册
- `app/preload.ts`: `contextBridge` 暴露安全 API 到 `window`
- `app/ipc/`: IPC 代理与注册（`electron-ipc-cat`）
- `app/database/`: SQLite 初始化与数据库服务
- `app/subtitle-handler/`: SRT 字幕解析、清洗、处理逻辑
- `e2e/`: Playwright 用例
- `dist/`: Angular 构建输出，供生产模式 Electron 加载

## 3. 运行与构建命令
- 开发联调（Angular + Electron）: `npm start`
- 构建 Angular + Electron 启动资源: `npm run build`
- 本地运行 Electron（基于已构建资源）: `npm run electron:local`
- 打包桌面应用: `npm run electron:build`
- 代码检查: `npm run lint`
- 运行全部测试: `npm test`
- Electron 侧测试: `npm run electron:test`
- Angular 侧测试: `npm run angular-test`
- E2E 测试: `npm run e2e`

## 4. 架构边界（必须遵守）
- 渲染进程（`src/`）禁止直接访问 Node 原生能力（如 `fs`、`path`、`better-sqlite3`）。
- 所有系统能力必须通过 `preload -> IPC -> app/*` 链路暴露。
- 新增跨进程能力时，按以下顺序实现:
  1. 在 `app/*` 实现主进程服务。
  2. 在对应 `*.interface.ts` 增加 IPC descriptor 与类型。
  3. 在 `app/ipc/index.ts` 注册 `registerProxy`。
  4. 在 `app/ipc/ipc-service.ts` 暴露 client 代理。
  5. 在 `app/preload.ts` 暴露到 `window`。
  6. 在 `src/app/window.d.ts` 或 `app/ipc/ipc-api.d.ts` 补齐类型声明。

## 5. 安全与稳定性要求
- 保持 `contextIsolation: true`。
- 不开启 `nodeIntegration` 给渲染进程。
- `window` 上仅暴露最小必要 API，不直接挂高权限对象。
- 不要绕过 preload 直接在 Angular 代码中调用 Electron API。

## 6. 开发约定
- Angular 功能开发优先放在 `src/app/<feature>/`，保持 `*.ts/html/scss/spec.ts` 配套。
- 文案走 i18n 文件（`src/assets/i18n/*.json`），避免硬编码。
- 复杂字幕处理逻辑优先落在 `app/subtitle-handler/`，保持纯函数与可测试性。
- 数据库改动先改 `app/database/*`，再通过 IPC 暴露给前端。
- 使用 UTF-8 编码

## 7. 测试门禁（提交前至少执行）
1. `npm run lint`
2. `npm run electron:test`
3. `npm run angular-test`

如改动涉及用户主流程或页面导航，再补充:
4. `npm run e2e`

## 8. 常见任务策略
- 新增数据库能力: `database service -> IPC descriptor -> preload/window type -> Angular service`
- 新增字幕算法: 先在 `app/subtitle-handler/` 写实现和单测，再接 IPC
- 新增页面: `src/app/` 建 feature，补路由、组件测试、必要的 E2E

## 9. 禁止事项
- 禁止在 `src/` 直接导入 Node/Electron 原生模块。
- 禁止跳过 IPC 边界把数据库实例或高权限对象直接暴露到前端。
- 禁止在跨进程重构时不补测试直接提交。

## 10. 交付要求（给代理）
- 说明改动影响层（`src` / `app` / `preload` / `ipc` / `database` / `subtitle-handler`）。
- 给出可执行验证命令和预期结果。
- 若存在架构冲突，优先保证安全边界与最小改动，再提出重构方案。
