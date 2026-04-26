import { createProxy } from "electron-ipc-cat/client";
import { AsyncifyProxy } from "electron-ipc-cat/common";
import { Observable } from "rxjs";

import { DicServiceIPCDescriptor, IDatabaseService } from "../db/services/dictionary/dic-service-interface";
import { DialogServiceIPCDescriptor, IDialogService } from "../dialog/dialog-service.interface";
import { ISubtitleService, SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service.interface";
import { CollectionServiceIPCDescriptor, ICollectionService } from "../db/services/repetition/collection/col-service-interface";

export const dic = createProxy<AsyncifyProxy<IDatabaseService>>(DicServiceIPCDescriptor);
export const dialog = createProxy<AsyncifyProxy<IDialogService>>(DialogServiceIPCDescriptor);
export const subtitle = createProxy<AsyncifyProxy<ISubtitleService>>(SubtitleServiceIPCDescriptor, Observable);
export const collection = createProxy<AsyncifyProxy<ICollectionService>>(CollectionServiceIPCDescriptor);

export const descriptors = {
    dic: DicServiceIPCDescriptor,
    dialog: DialogServiceIPCDescriptor,
    subtitle: SubtitleServiceIPCDescriptor,
    collection: CollectionServiceIPCDescriptor,
};
