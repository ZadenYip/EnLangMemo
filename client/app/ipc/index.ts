import { registerProxy } from "electron-ipc-cat/server";
import { DicServiceIPCDescriptor } from "../db/services/dictionary/dic-service-interface.js";
import { DictionaryService } from "../db/services/dictionary/dic-service.js";
import { DialogService } from "../dialog/dialog-service.js";
import { DialogServiceIPCDescriptor } from "../dialog/dialog-service-interface.js";
import { SubtitleService } from "../subtitle-handler/subtitle-service.js";
import { SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service-interface.js";
import { CollectionService } from "../db/services/repetition/collection/col-service.js";
import { CollectionServiceIPCDescriptor } from "../db/services/repetition/collection/col-service-interface.js";
import { DeckIpcService } from "../db/services/repetition/deck/deck-ipc-service.js";
import { DeckServiceIPCDescriptor } from "../db/services/repetition/deck/deck-service-interface.js";
import { NoteTplService } from "../db/services/repetition/note-template/nt-tpl-service.js";
import { NoteTplServiceIPCDescriptor } from "../db/services/repetition/note-template/nt-tpl-service-interface.js";
import { DicNoteMappingService } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service.js";
import { DicNoteMappingServiceIPCDescriptor } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service-interface.js";
import { PcsNoteIpcService } from "../db/services/repetition/processing-note/pcs-note-ipc-service.js";
import { PcsNoteServiceIPCDescriptor } from "../db/services/repetition/processing-note/pcs-note-service-interface.js";
import { CardIpcService } from "../db/services/repetition/cards/card-ipc-service.js";
import { CardServiceIPCDescriptor } from "../db/services/repetition/cards/card-service-interface.js";
import { AuthIpcService } from "../oauth/auth-ipc-service.js";
import { AuthServiceIPCDescriptor } from "../oauth/auth-service-interface.js";
import { SyncIpcService } from "../sync/sync-ipc-service.js";
import { SyncServiceIPCDescriptor } from "../sync/sync-service-interface.js";

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

    const collectionService = new CollectionService();
    registerProxy(collectionService, CollectionServiceIPCDescriptor);

    const deckService = new DeckIpcService();
    registerProxy(deckService, DeckServiceIPCDescriptor);

    const noteTplService = new NoteTplService();
    registerProxy(noteTplService, NoteTplServiceIPCDescriptor);

    const dicNoteMappingService = new DicNoteMappingService();
    registerProxy(dicNoteMappingService, DicNoteMappingServiceIPCDescriptor);

    const pcsNoteService = new PcsNoteIpcService();
    registerProxy(pcsNoteService, PcsNoteServiceIPCDescriptor);

    const cardService = new CardIpcService();
    registerProxy(cardService, CardServiceIPCDescriptor);

    const authService = new AuthIpcService();
    registerProxy(authService, AuthServiceIPCDescriptor);

    const syncService = new SyncIpcService();
    registerProxy(syncService, SyncServiceIPCDescriptor);
}
