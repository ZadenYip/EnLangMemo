import { ipcMain, IpcMainInvokeEvent, webUtils } from "electron";
import { runSQL } from "../database/database";
import { parseSubtitle } from "../subtitle-handler/subtitle-handler";

export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
    registerSubtitleLibHandlers();
}

function registerDatabaseHandlers() {
    ipcMain.handle(
        'database:runSQL', async (event: IpcMainInvokeEvent, sql: string, params?: any[]) => {
            return runSQL(sql, params);
        }
    );
}

function registerSubtitleLibHandlers() {
    ipcMain.handle(
        'subtitleLib:parseSubtitle', parseSubtitle
    )
}