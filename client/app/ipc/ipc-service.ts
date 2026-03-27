import { createProxy } from 'electron-ipc-cat/client';
import { AsyncifyProxy } from 'electron-ipc-cat/common';
import { Observable } from 'rxjs';

import { DicServiceIPCDescriptor, IDatabaseService } from "../db/services/dic-service-interface";
import { ISubtitleService, SubtitleServiceIPCDescriptor } from '../subtitle-handler/subtitle-service.interface';

export const dicService = createProxy<AsyncifyProxy<IDatabaseService>>(DicServiceIPCDescriptor);
export const subtitleService = createProxy<AsyncifyProxy<ISubtitleService>>(SubtitleServiceIPCDescriptor, Observable);

export const descriptors = {
    dicService: DicServiceIPCDescriptor,
    subtitleService: SubtitleServiceIPCDescriptor,
};
