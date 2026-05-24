import { computed, inject, Injectable, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Definition, DictionaryEntry } from "@main/db/services/dictionary/dic-service-types";
import { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service.types";
import {
    createEmptyOption,
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";
import Logger from "electron-log/renderer";
import { firstValueFrom } from "rxjs";
import {
    NoteFieldMappingDialogComponent,
    NoteFieldMappingDialogData,
} from "./dialog/note-field-mapping-dialog.component";
import { NotifyService } from "../services/notify.service";
import { TranslateService } from "@ngx-translate/core";
import { DictionarySelectionService } from "./selection/selection.service";
import {
    DicNoteFieldMapping,
    DicNoteMapWithNoteType,
} from "@main/db/services/repetition/dic-note-mapping/dic-nt-mapping-types";
import {
    NoteField,
    PcsNote,
} from "@main/db/services/repetition/processing-note/pcs-note-types";

type DraftDicNoteFieldMapping = Partial<DicNoteFieldMapping>;

/**
 * Service for managing dictionary note creation and field mapping.
 */
@Injectable({ providedIn: "root" })
export class DictionaryNoteService {
    private readonly dialog = inject(MatDialog);
    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);
    private readonly selectionService = inject(DictionarySelectionService);

    /**
     * Available note template dropdown options.
     */
    readonly noteTplOptions = signal<SelectDropdownOption[]>([]);

    /**
     * Currently selected note template option.
     */
    readonly selectedNoteTpl = signal<SelectDropdownOption>(createEmptyOption());

    /**
     * Currently selected note template detail.
     */
    readonly curNoteTpl = signal<NoteTemplate | null>(null);

    /**
     * Field mapping from dictionary definition data to note template fields.
     */
    readonly fieldMapping = signal<DraftDicNoteFieldMapping>({});

    /**
     * Field options from current note template.
     */
    readonly fieldOptions = computed<SelectDropdownOption[]>(() =>
        this.curNoteTpl()?.fields.map((field) => ({
            label: field.name,
            value: String(field.id),
        })) ?? [],
    );

    /**
     * Whether current mapping has all required targets.
     */
    readonly hasValidMapping = computed(() => {
        return Boolean(this.selectedNoteTpl().value && this.isCompleteMapping(this.fieldMapping()));
    });

    /**
     * Load note template references and saved dictionary note mapping config.
     */
    async reload(): Promise<void> {
        const refs = await window.service.ntTpl.getAllNoteTplRefs();
        const options = refs.map((ref) => ({
            label: ref.name,
            value: ref.id,
        }));
        this.noteTplOptions.set(options);

        const savedConfig = await window.service.dicNoteMap.getMappingConfig();
        const savedOption = savedConfig
            ? options.find((option) => option.value === savedConfig.noteTypeId)
            : undefined;
        await this.selectNoteTpl(savedOption ?? options[0]);

        if (savedOption && savedConfig) {
            this.fieldMapping.set(savedConfig.dicNoteMapping.fieldMap);
        }
    }

    /**
     * Select note template and load its field metadata.
     */
    async selectNoteTpl(option: SelectDropdownOption): Promise<void> {
        this.selectedNoteTpl.set(option);
        if (!option.value) {
            this.curNoteTpl.set(null);
            this.fieldMapping.set({});
            return;
        }

        const noteTpl = await window.service.ntTpl.getNoteTplById(option.value);
        this.curNoteTpl.set(noteTpl);
        this.fieldMapping.set({});
    }

    /**
     * Open dialog for selecting dictionary-to-note field mapping.
     */
    async openFieldMappingDialog(): Promise<void> {
        const mapping = await firstValueFrom(
            this.dialog.open<
                NoteFieldMappingDialogComponent,
                NoteFieldMappingDialogData,
                DraftDicNoteFieldMapping | null
            >(NoteFieldMappingDialogComponent, {
                data: {
                    fieldOptions: this.fieldOptions(),
                    mapping: this.fieldMapping(),
                },
            }).afterClosed(),
        );
        if (!mapping) {
            return;
        }
        this.fieldMapping.set(mapping);
        await this.saveMappingConfig();
    }

    /**
     * Save current single dictionary note mapping config.
     */
    private async saveMappingConfig(): Promise<void> {
        const fieldMap = this.fieldMapping();

        const noteTypeId = this.selectedNoteTpl().value;
        const config: DicNoteMapWithNoteType = {
            noteTypeId,
            dicNoteMapping: {
                fieldMap: fieldMap as DicNoteFieldMapping,
            },
        };

        await window.service.dicNoteMap.saveMappingConfig(config);
        this.notify.open(this.translate.instant("DICTIONARY.NOTE_MAPPING.SAVE_SUCCESS"));
    }

    /**
     * Check whether the mapping has required dictionary fields.
     * wordField and srcDef are required
     */
    private isCompleteMapping(mapping: DraftDicNoteFieldMapping): mapping is DicNoteFieldMapping {
        return mapping.wordFieldId !== undefined && mapping.srcDefFieldId !== undefined;
    }

    /**
     * Prepare note payload from dictionary definition and notify result.
     */
    async addToBench(entry: DictionaryEntry, def: Definition): Promise<void> {
        const payload = this.buildNotePayload(entry, def);
        if (!payload) {
            this.notify.open(this.translate.instant("DICTIONARY.NOTE_MAPPING.INCOMPLETE"));
            return;
        }

        Logger.info("Adding to processing pool with payload:", payload);

        const result = await window.service.pcsNote.addPcsNote(payload);
        if (result.state !== "success") {
            Logger.warn("Adding to processing pool failed:", result.state);
            this.notify.open(this.translate.instant("DICTIONARY.ADD_TO_PROCESSING_POOL_FAILED"));
            return;
        }

        this.notify.open(this.translate.instant("DICTIONARY.ADD_TO_PROCESSING_POOL_SUCCESS"));
    }

    /**
     * Build note payload from selected dictionary definition and current mapping.
     */
    private buildNotePayload(entry: DictionaryEntry, def: Definition): PcsNote | null {
        const mapping = this.fieldMapping();
        const noteTpl = this.curNoteTpl();
        if (!this.hasValidMapping() || !noteTpl) {
            return null;
        }

        return {
            // id will be assigned by backend, so can be left empty here
            id: "",
            noteTplId: this.selectedNoteTpl().value,
            senseId: def.defId,
            fields: this.buildMappedFields(noteTpl.fields, mapping, def, entry),
        };
    }

    /**
     * Build all note template fields and fill unmapped fields with empty text.
     */
    private buildMappedFields(
        noteFields: NoteTemplate["fields"],
        mapping: DraftDicNoteFieldMapping,
        definition: Definition,
        entry: DictionaryEntry,
    ): NoteField[] {
        /** Current dictionary text selection used to fill mapped fields. */
        const selection = this.selectionService.selection();
        /** Combined phonetic text written when a phonetic target field is mapped. */
        const phonetic = [entry.phoneticSymbol.bre, entry.phoneticSymbol.ame]
            .filter(Boolean)
            .join(" / ");
        /** Dictionary values paired with mapped note template field business ids. */
        const mappedValues = new Map<number, string>();
        this.setMappedValue(mappedValues, mapping.wordFieldId, selection.selectedText);
        this.setMappedValue(mappedValues, mapping.contextFieldId, selection.contextSentence);
        this.setMappedValue(mappedValues, mapping.srcDefFieldId, definition.definition.src);
        this.setMappedValue(mappedValues, mapping.tgtDefFieldId, definition.definition.target);
        this.setMappedValue(mappedValues, mapping.phoneticFieldId, phonetic);

        return noteFields.map((field) => ({
            id: String(field.id),
            value: mappedValues.get(field.id) ?? "",
        }));
    }

    /**
     * Set a dictionary value only when a target note template field is mapped.
     */
    private setMappedValue(mappedValues: Map<number, string>, fieldId: number | undefined, value: string): void {
        if (fieldId === undefined) {
            return;
        }
        mappedValues.set(fieldId, value);
    }

}
