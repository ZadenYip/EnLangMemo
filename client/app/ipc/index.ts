import { registerProxy } from "electron-ipc-cat/server";
import { DicServiceIPCDescriptor } from "../db/services/dictionary/dic-service-interface";
import { DictionaryService } from "../db/services/dictionary/dic-service";
import { DialogService } from "../dialog/dialog-service";
import { DialogServiceIPCDescriptor } from "../dialog/dialog-service-interface";
import { SubtitleService } from "../subtitle-handler/subtitle-service";
import { SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service-interface";
import { CollectionService } from "../db/services/repetition/collection/col-service";
import { CollectionServiceIPCDescriptor } from "../db/services/repetition/collection/col-service-interface";
import { DeckIpcService } from "../db/services/repetition/deck/deck-ipc-service";
import { DeckServiceIPCDescriptor } from "../db/services/repetition/deck/deck-service-interface";
import { NoteTplService } from "../db/services/repetition/note-template/nt-tpl-service";
import { NoteTplServiceIPCDescriptor } from "../db/services/repetition/note-template/nt-tpl-service-interface";
import { DicNoteMappingService } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service";
import { DicNoteMappingServiceIPCDescriptor } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service-interface";
import { PcsNoteIpcService } from "../db/services/repetition/processing-note/pcs-note-ipc-service";
import { PcsNoteServiceIPCDescriptor } from "../db/services/repetition/processing-note/pcs-note-service-interface";
import { CardIpcService } from "../db/services/repetition/cards/card-ipc-service";
import { CardServiceIPCDescriptor } from "../db/services/repetition/cards/card-service-interface";
import { AuthIpcService } from "../oauth/auth-ipc-service";
import { AuthServiceIPCDescriptor } from "../oauth/auth-service-interface";

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
}
