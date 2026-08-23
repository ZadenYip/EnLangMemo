import { createProxy } from "electron-ipc-cat/client";
import { AsyncifyProxy } from "electron-ipc-cat/common";
import { Observable } from "rxjs";

import { DicServiceIPCDescriptor, IDatabaseService } from "../db/services/dictionary/dic-service-interface.js";
import { DialogServiceIPCDescriptor, IDialogService } from "../dialog/dialog-service-interface.js";
import { ISubtitleService, SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service-interface.js";
import { CollectionServiceIPCDescriptor, ICollectionService } from "../db/services/repetition/collection/col-service-interface.js";
import { DeckServiceIPCDescriptor, IDeckService } from "../db/services/repetition/deck/deck-service-interface.js";
import { INoteTplService, NoteTplServiceIPCDescriptor } from "../db/services/repetition/note-template/nt-tpl-service-interface.js";
import { DicNoteMappingServiceIPCDescriptor, IDicNoteMappingService } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service-interface.js";
import { IPcsNoteService, PcsNoteServiceIPCDescriptor } from "../db/services/repetition/processing-note/pcs-note-service-interface.js";
import { CardServiceIPCDescriptor, ICardService } from "../db/services/repetition/cards/card-service-interface.js";
import { AuthServiceIPCDescriptor, IAuthService } from "../oauth/auth-service-interface.js";
import { ISyncService, SyncServiceIPCDescriptor } from "../sync/sync-service-interface.js";

export const dic = createProxy<AsyncifyProxy<IDatabaseService>>(DicServiceIPCDescriptor, Observable);
export const dialog = createProxy<AsyncifyProxy<IDialogService>>(DialogServiceIPCDescriptor);
export const subtitle = createProxy<AsyncifyProxy<ISubtitleService>>(SubtitleServiceIPCDescriptor, Observable);
export const collection = createProxy<AsyncifyProxy<ICollectionService>>(CollectionServiceIPCDescriptor);
export const deck = createProxy<AsyncifyProxy<IDeckService>>(DeckServiceIPCDescriptor);
export const ntTpl = createProxy<AsyncifyProxy<INoteTplService>>(NoteTplServiceIPCDescriptor);
export const dicNoteMap = createProxy<AsyncifyProxy<IDicNoteMappingService>>(DicNoteMappingServiceIPCDescriptor);
export const pcsNote = createProxy<AsyncifyProxy<IPcsNoteService>>(PcsNoteServiceIPCDescriptor);
export const card = createProxy<AsyncifyProxy<ICardService>>(CardServiceIPCDescriptor);
export const auth = createProxy<AsyncifyProxy<IAuthService>>(AuthServiceIPCDescriptor);
export const sync = createProxy<AsyncifyProxy<ISyncService>>(SyncServiceIPCDescriptor);

export const descriptors = {
    dic: DicServiceIPCDescriptor,
    dialog: DialogServiceIPCDescriptor,
    subtitle: SubtitleServiceIPCDescriptor,
    collection: CollectionServiceIPCDescriptor,
    deck: DeckServiceIPCDescriptor,
    ntTpl: NoteTplServiceIPCDescriptor,
    dicNoteMap: DicNoteMappingServiceIPCDescriptor,
    pcsNote: PcsNoteServiceIPCDescriptor,
    card: CardServiceIPCDescriptor,
    auth: AuthServiceIPCDescriptor,
    sync: SyncServiceIPCDescriptor,
};
