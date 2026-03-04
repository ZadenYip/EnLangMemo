import { registerProxy } from 'electron-ipc-cat/server';
import { DatabaseServiceIPCDescriptor } from '../database/database-service.interface';
import { DatabaseService } from '../database/database-service';
import { SubtitleService } from '../subtitle-handler/subtitle-service';
import { SubtitleServiceIPCDescriptor } from '../subtitle-handler/subtitle-service.interface';

export function registerAllIPCHandlers() {
    registerDatabaseHandlers();
}

function registerDatabaseHandlers() {
    const databaseService = new DatabaseService();
    registerProxy(databaseService, DatabaseServiceIPCDescriptor);

    const subtitleService = new SubtitleService();
    registerProxy(subtitleService, SubtitleServiceIPCDescriptor);
}

