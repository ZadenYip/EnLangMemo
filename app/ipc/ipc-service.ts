import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';
import { Observable } from 'rxjs';

import { DatabaseServiceIPCDescriptor, IDatabaseService } from "../database/database-service.interface";
import { ISubtitleService, SubtitleServiceIPCDescriptor } from '../subtitle-handler/subtitle-service.interface';

export const database = createProxy<AsyncifyProxy<IDatabaseService>>(DatabaseServiceIPCDescriptor);
export const subtitleService = createProxy<AsyncifyProxy<ISubtitleService>>(SubtitleServiceIPCDescriptor, Observable);

export const descriptors = {
    database: DatabaseServiceIPCDescriptor,
    subtitleService: SubtitleServiceIPCDescriptor,
};
