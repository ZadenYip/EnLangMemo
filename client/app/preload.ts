import { contextBridge, webUtils } from "electron";
import * as service from "./ipc/ipc-service.js";


contextBridge.exposeInMainWorld("service", service);
contextBridge.exposeInMainWorld("electron", {
    webUtils: {
        getPathForFile: (file: File) => webUtils.getPathForFile(file)
    }
});

console.log("[Preload] Exposed services to window");