# Preload IPC Documentation

translated from README-ZH.md by Claude Opus 4.5

Using [electron-ipc-cat](https://github.com/linonetwo/electron-ipc-cat) to simplify IPC communication.

## Why Separate Interface and Implementation into Two Files?

First, you need to know:

When esbuild bundles `preload.ts`, it follows the import chain and bundles all dependencies:

```
preload.ts
  └─ service.ts
       └─ database-service.ts        ← This file contains the DatabaseService class
            └─ better-sqlite3        ← Unnecessarily bundled into preload ✗
```

To solve this problem, separate **interface** and **implementation**:

```
database-service.interface.ts   ← Only interface and descriptor
database-service.ts             ← Has class and better-sqlite3
```

Then, `ipc-service.ts` uses electron-ipc-cat's `createProxy` to create proxy objects, avoiding importing the implementation class.

```typescript
import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';

import { DatabaseServiceIPCDescriptor, IDatabaseService } from "../database/database-service.interface";

export const database = createProxy<AsyncifyProxy<IDatabaseService>>(DatabaseServiceIPCDescriptor);

export const descriptors = {
    database: DatabaseServiceIPCDescriptor,
};
```

The generic `<AsyncifyProxy<IDatabaseService>>` just tells TypeScript the return type for IDE intellisense. It doesn't exist at runtime.

## How to Add a New Service

Reference [electron-ipc-cat](https://github.com/linonetwo/electron-ipc-cat#1-the-class). Here we use the database service as an example:

```typescript
/** database-service.interface.ts **/

export interface IDatabaseService {
    // Method signature return type can be Promise or Observable
    runSQL(sql: string, params?: any[]): Promise<any[] | Database.RunResult>;
}

// Descriptor object, used by createProxy and registerProxy
export const DatabaseServiceIPCDescriptor = {
    channel: 'database',
    properties: {
        // Corresponds to runSQL above. ProxyPropertyType.Function means it's a function.
        // Use Value for properties instead.
        runSQL: ProxyPropertyType.Function
    },
};
```

Next, implement the interface (skipped here), then proceed to registration:

```typescript
/** app/ipc/index.ts **/
import { registerProxy } from 'electron-ipc-cat/server';
import { DatabaseServiceIPCDescriptor } from '../database/database-service.interface';
import { DatabaseService } from '../database/database-service';

// Called by main process
export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
}

function registerDatabaseHandlers() {
    // Create service instance
    const databaseService = new DatabaseService();
    // Register IPC handler with service instance and the descriptor from interface
    registerProxy(databaseService, DatabaseServiceIPCDescriptor);
}
```

After registration, create proxy objects for preload to use. We introduce an `ipc-service.ts` file for better organization:

```typescript
/** app/ipc/ipc-service.ts **/
import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';

import { DatabaseServiceIPCDescriptor, IDatabaseService } from "../database/database-service.interface";

export const database = createProxy<AsyncifyProxy<IDatabaseService>>(DatabaseServiceIPCDescriptor);

// Not sure what this is for. No files seem to reference it, but electron-ipc-cat examples have it, so keeping it.
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

Finally, to let the renderer process know which service are available, add a type declaration file `ipc-api.d.ts` and include it in Angular's `tsconfig.app.json`:

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

Now you can call the database service in the renderer process via `window.service.database.runSQL(...)`.
