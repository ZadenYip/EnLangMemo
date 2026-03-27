import { registerProxy } from 'electron-ipc-cat/server';
import { DicServiceIPCDescriptor } from '../db/services/dic-service-interface';
import { DictionaryService } from '../db/services/dic-service';
import { SubtitleService } from '../subtitle-handler/subtitle-service';
import { SubtitleServiceIPCDescriptor } from '../subtitle-handler/subtitle-service.interface';

export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
}

function registerDatabaseHandlers() {
    const databaseService = new DictionaryService();
    registerProxy(databaseService, DicServiceIPCDescriptor);

    const subtitleService = new SubtitleService();
    registerProxy(subtitleService, SubtitleServiceIPCDescriptor);
}

