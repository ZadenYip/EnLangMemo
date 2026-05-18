import { registerProxy } from "electron-ipc-cat/server";
import { DicServiceIPCDescriptor } from "../db/services/dictionary/dic-service-interface";
import { DictionaryService } from "../db/services/dictionary/dic-service";
import { DialogService } from "../dialog/dialog-service";
import { DialogServiceIPCDescriptor } from "../dialog/dialog-service.interface";
import { SubtitleService } from "../subtitle-handler/subtitle-service";
import { SubtitleServiceIPCDescriptor } from "../subtitle-handler/subtitle-service.interface";
import { CollectionService } from "../db/services/repetition/collection/col-service";
import { CollectionServiceIPCDescriptor } from "../db/services/repetition/collection/col-service-interface";
import { DeckService } from "../db/services/repetition/deck/deck-service";
import { DeckServiceIPCDescriptor } from "../db/services/repetition/deck/deck-service-interface";
import { NoteTemplateService } from "../db/services/repetition/note/nt-service";
import { NoteTemplateServiceIPCDescriptor } from "../db/services/repetition/note/nt-service-interface";
import { DicNoteMappingService } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service";
import { DicNoteMappingServiceIPCDescriptor } from "../db/services/repetition/dic-note-mapping/dic-nt-mapping-service-interface";
import { DicNoteAddingService } from "../db/services/repetition/dic-note-adding/dic-nt-adding-service";
import { DicNoteAddingServiceIPCDescriptor } from "../db/services/repetition/dic-note-adding/dic-nt-adding-service-interface";

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

    const deckService = new DeckService();
    registerProxy(deckService, DeckServiceIPCDescriptor);

    const noteTemplateService = new NoteTemplateService();
    registerProxy(noteTemplateService, NoteTemplateServiceIPCDescriptor);

    const dicNoteMappingService = new DicNoteMappingService();
    registerProxy(dicNoteMappingService, DicNoteMappingServiceIPCDescriptor);

    const dicNoteAddingService = new DicNoteAddingService();
    registerProxy(dicNoteAddingService, DicNoteAddingServiceIPCDescriptor);
}
