# Preload IPC 文档

使用 [electron-ipc-cat](https://github.com/linonetwo/electron-ipc-cat) 简化 IPC 通信。

## 为什么接口和实现要分开两个文件？

首先要知道的是：  

esbuild 打包工具对 preload.ts 进行打包时，会顺着 import 链把所有依赖都打包进来：

```
preload.ts
  └─ service.ts
       └─ database-service.ts        ← 这个文件里有 DatabaseService 类
            └─ better-sqlite3        ← 不必要的打包进了 preload X
```

为了解决这个问题，把**接口**和**实现**分开：

```
database-service.interface.ts   ← 只有 interface 和描述符
database-service.ts             ← 有 class 和 better-sqlite3
```

接着，ipc-service.ts 使用 electron-ipc-cat createProxy 创建代理对象，避免引入实现类。

```
import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';

import { DatabaseServiceIPCDescriptor, IDatabaseService } from "../database/database-service.interface";

export const database = createProxy<AsyncifyProxy<IDatabaseService>>(DatabaseServiceIPCDescriptor);

export const descriptors = {
    database: DatabaseServiceIPCDescriptor,
};
```

泛型 `<AsyncifyProxy<IDatabaseService>>` 只是告诉 TypeScript 返回值类型，让 IDE 有智能提示，运行时不存在。

## 正确添加新的 Service

参考 [electron-ipc-cat](https://github.com/linonetwo/electron-ipc-cat#1-the-class)，这里就以数据库服务为例：

```typescript
/** database-service.interface.ts **/

export interface IDatabaseService {
    // 这里方法签名返回类型可以用 Promise 或者 Observable
    runSQL(sql: string, params?: any[]): Promise<any[] | Database.RunResult>;
}

// 描述符对象，给 createProxy 和 registerProxy 用
export const DatabaseServiceIPCDescriptor = {
    channel: 'database',
    properties: {
        // 对应上面接口的runSQL，ProxyPropertyType.Function 表示这是个函数，如果是 Value 则表示是属性（property）
        runSQL: ProxyPropertyType.Function
    },
};
```

接下来去实现这个接口就行了，这里就跳过这一步，直接进入注册阶段：

```typescript
/** app/ipc/index.ts **/
import { registerProxy } from 'electron-ipc-cat/server';
import { DatabaseServiceIPCDescriptor } from '../database/database-service.interface';
import { DatabaseService } from '../database/database-service';

// 会被 main 进程调用
export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
}

function registerDatabaseHandlers() {
    // 创建服务实例
    const databaseService = new DatabaseService();
    // 注册 IPC 处理器，这里传入服务实例以及导入接口对应的 descriptor
    registerProxy(databaseService, DatabaseServiceIPCDescriptor);
}
```

注册后，就要创建代理对象给 preload 进行操作，为了方便管理我们引入一个 ipc-service.ts 文件：

```typescript
/** app/ipc/ipc-service.ts **/
import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';

import { DatabaseServiceIPCDescriptor, IDatabaseService } from "../database/database-service.interface";

export const database = createProxy<AsyncifyProxy<IDatabaseService>>(DatabaseServiceIPCDescriptor);

// 这个我也不知道有啥用，没看到有任何文件和这个有关联，但是 electron-ipc-cat 例子里有，就放着吧
export const descriptors = {
    database: DatabaseServiceIPCDescriptor,
};
```

```typescript
/** app/preload.ts **/
import { contextBridge } from "electron";
import * as service from "./ipc/ipc-service";

contextBridge.exposeInMainWorld('service', service);

console.log('[Preload] Exposed service to window');
```

注意这里要用 service 而不是 services，因为 electron-ipc-cat 的 fixContextIsolation 希望暴露到 window.service（注意没有 s），不然 window.observables 无法正常工作。此外，要在渲染进程主页面引入`import 'electron-ipc-cat/fixContextIsolation';`，这样子window.observables 才能正常工作。

最后为了让渲染进程处知道有哪些 Service，可以添加一个类型声明文件 ipc-api.d.ts，并 include 到 angular 的 tsconfig.app.json 里

```typescript
import { IServicesWithOnlyObservables, IServicesWithoutObservables } from "electron-ipc-cat/common";
import * as service from "./ipc-service";

declare global {
  interface Window {
    observables: IServicesWithOnlyObservables<typeof service>;
    service: IServicesWithoutObservables<typeof service>;
  }
}

```

现在就可以在渲染进程通过 `window.service.database.runSQL(...)` 来调用数据库服务了。
