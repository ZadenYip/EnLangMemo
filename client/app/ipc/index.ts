import { registerProxy } from "electron-ipc-cat/server";
import { DicServiceIPCDescriptor } from "../db/services/dictionary/dic-service-interface";
import { DictionaryService } from "../db/services/dictionary/dic-service";
import { DialogService } from "../dialog/dialog-service";
import { DialogServiceIPCDescriptor } from "../dialog/dialog-service.interface";
import { SubtitleService } from "../subtitle-handler/subtitle-service";
import { SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service.interface";

export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
}

function registerDatabaseHandlers() {
    const databaseService = new DictionaryService();
    registerProxy(databaseService, DicServiceIPCDescriptor);

    const dialogService = new DialogService();
    registerProxy(dialogService, DialogServiceIPCDescriptor);

    const subtitleService = new SubtitleService();
    registerProxy(subtitleService, SubtitleServiceIPCDescriptor);
}
