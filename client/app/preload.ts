import { contextBridge, webUtils } from "electron";
import * as service from "./ipc/ipc-service";

console.log('[Preload] Loading preload script...');
console.log('[Preload] services object:', service);
console.log('[Preload] services.dicService:', service.dicService);

contextBridge.exposeInMainWorld('service', service);
contextBridge.exposeInMainWorld('electron', {
    webUtils: {
        getPathForFile: (file: File) => webUtils.getPathForFile(file)
    }
});

console.log('[Preload] Exposed services to window');