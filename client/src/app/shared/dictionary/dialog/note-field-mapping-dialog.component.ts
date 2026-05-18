import { Component, computed, inject, signal } from "@angular/core";
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule } from "@ngx-translate/core";
import { SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { DicNoteFieldMapping } from "@main/db/services/repetition/dic-note-mapping/dic-nt-mapping-types";

type DraftDicNoteFieldMapping = Partial<DicNoteFieldMapping>;

export interface NoteFieldMappingDialogData {
    fieldOptions: SelectDropdownOption[];
    mapping: DraftDicNoteFieldMapping;
}

@Component({
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogActions,
        MatDialogContent,
        MatDialogTitle,
        SelectDropdownComponent,
        TranslateModule,
    ],
    templateUrl: "./note-field-mapping-dialog.component.html",
    styleUrl: "./note-field-mapping-dialog.component.scss",
})
export class NoteFieldMappingDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<NoteFieldMappingDialogComponent, DraftDicNoteFieldMapping | null>);
    private readonly data = inject(MAT_DIALOG_DATA) as NoteFieldMappingDialogData;

    /**
     * Available note template field options with a no-mapping option.
     */
    readonly fieldOptions: SelectDropdownOption[] = [
        {
            value: "",
            labelKey: "DICTIONARY.NOTE_MAPPING.NO_MAPPING",
        },
        ...this.data.fieldOptions,
    ];

    /**
     * Draft field mapping selected in this dialog.
     */
    readonly mapping = signal<DraftDicNoteFieldMapping>({ ...this.data.mapping });

    /**
     * Currently selected lookup word field option.
     */
    readonly selectedTextOption = signal(this.findOption(this.data.mapping.wordFieldId));

    /**
     * Currently selected context sentence field option.
     */
    readonly contextOption = signal(this.findOption(this.data.mapping.contextFieldId));

    /**
     * Currently selected source definition field option.
     */
    readonly srcDefOption = signal(this.findOption(this.data.mapping.srcDefFieldId));

    /**
     * Currently selected target definition field option.
     */
    readonly tgtDefOption = signal(this.findOption(this.data.mapping.tgtDefFieldId));

    /**
     * Currently selected phonetic field option.
     */
    readonly phoneticOption = signal(this.findOption(this.data.mapping.phoneticFieldId));

    /**
     * Whether the required mapping fields are selected.
     */
    readonly canConfirm = computed(() => this.isRequiredMappingReady(this.mapping()));

    /**
     * Update lookup word field mapping.
     */
    selectSelectedText(option: SelectDropdownOption): void {
        this.selectedTextOption.set(option);
        this.mapping.update((mapping) => ({
            ...mapping,
            wordFieldId: this.toFieldId(option.value),
        }));
    }

    /**
     * Update context sentence field mapping.
     */
    selectContext(option: SelectDropdownOption): void {
        this.contextOption.set(option);
        this.mapping.update((mapping) => ({
            ...mapping,
            contextFieldId: this.toFieldId(option.value),
        }));
    }

    /**
     * Update source definition field mapping.
     */
    selectSrcDefinition(option: SelectDropdownOption): void {
        this.srcDefOption.set(option);
        this.mapping.update((mapping) => ({
            ...mapping,
            srcDefFieldId: this.toFieldId(option.value),
        }));
    }

    /**
     * Update target definition field mapping.
     */
    selectTargetDefinition(option: SelectDropdownOption): void {
        this.tgtDefOption.set(option);
        this.mapping.update((mapping) => ({
            ...mapping,
            tgtDefFieldId: this.toFieldId(option.value),
        }));
    }

    /**
     * Update phonetic field mapping.
     */
    selectPhonetic(option: SelectDropdownOption): void {
        this.phoneticOption.set(option);
        this.mapping.update((mapping) => ({
            ...mapping,
            phoneticFieldId: this.toFieldId(option.value),
        }));
    }

    /**
     * Confirm and return current mapping.
     */
    confirm(): void {
        if (!this.canConfirm()) {
            return;
        }
        this.dialogRef.close(this.mapping());
    }

    /**
     * Cancel field mapping changes.
     */
    cancel(): void {
        this.dialogRef.close(null);
    }

    private findOption(value?: number): SelectDropdownOption {
        return this.fieldOptions.find((option) => option.value === String(value ?? "")) ?? this.fieldOptions[0];
    }

    private toFieldId(value: string): number | undefined {
        return value ? Number(value) : undefined;
    }

    private isRequiredMappingReady(mapping: Partial<DicNoteFieldMapping>): boolean {
        return mapping.wordFieldId !== undefined && mapping.srcDefFieldId !== undefined;
    }
}
