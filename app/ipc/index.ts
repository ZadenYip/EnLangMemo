import { ipcMain, IpcMainInvokeEvent, webUtils } from "electron";
import { runSQL } from "../database/database";

export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
    // registerSubtitleLibHandlers(); TODO
}

function registerDatabaseHandlers() {
    ipcMain.handle(
        'database:runSQL', async (event: IpcMainInvokeEvent, sql: string, params?: any[]) => {
            return runSQL(sql, params);
        }
    );
}

// function registerSubtitleLibHandlers() {
//     ipcMain.handle(
//         'subtitleLib:parseSubtitle', parseSubtitle
//     )
// }