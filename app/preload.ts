import { contextBridge, ipcRenderer } from "electron";



contextBridge.exposeInMainWorld('bridge', {
    database: {
        ipcRunSQL: (sql: string, params: any[] = []) => ipcRenderer.invoke('database:runSQL', sql, params)
    }
});
