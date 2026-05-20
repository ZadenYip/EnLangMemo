import { computed, inject, Injectable, signal } from "@angular/core";
import { ProcessingNote, ProcessingNoteRef } from "@main/db/services/repetition/processing-note/pcs-note-types";
import { TranslateService } from "@ngx-translate/core";
import { NotifyService } from "@render/shared/services/notify.service";
import { BenchStateService } from "../bench-state.service";

@Injectable()
export class NoteContEditStateService {
    private readonly benchState = inject(BenchStateService);
    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);

    /**
     * Processing note references waiting to be edited.
     */
    readonly pcsNoteRefs = signal<ProcessingNoteRef[]>([]);

    /**
     * Current loaded processing note detail.
     */
    readonly curNote = signal<ProcessingNote | null>(null);

    /**
     * Whether processing note loading is running.
     */
    readonly isLoading = signal(false);

    /**
     * Current note template fields used to build the note content form.
     */
    readonly fields = computed(
        () => this.benchState.curNoteTpl()?.fields ?? [],
    );

    /**
     * Current processing note reference at the head of the FIFO queue.
     */
    readonly curRef = computed(() =>
        this.pcsNoteRefs()[0] ?? null,
    );

    /**
     * Remaining processing note count including the current note.
     */
    readonly remainingNoteCount = computed(() => this.pcsNoteRefs().length);

    /**
     * Load all processing note references and open the first pending note.
     */
    async reloadProcessingNotes(): Promise<void> {
        if (!this.beginLoading()) {
            return;
        }

        try {
            const refs = await window.service.pcsNote.getAllProcessingNoteRefs();
            this.pcsNoteRefs.set(refs);
            await this.loadCurPcsNote();
        } finally {
            this.endLoading();
        }
    }

    /**
     * Reload the note template that belongs to the current processing note.
     */
    async reloadCurNoteTpl(): Promise<void> {
        const note = this.curNote();
        if (!note) {
            return;
        }
        await this.benchState.loadNoteTplRefs(note.noteTplId);
    }

    /**
     * Read a field draft value for textarea binding.
     */
    fieldValue(fieldId: number): string {
        return (
            this.curNote()?.fields.find(
                (field) => field.id === String(fieldId),
            )!.value ?? ""
        );
    }

    /**
     * Update a single note field draft value.
     */
    updateFieldValue(fieldId: number, value: string): void {
        const targetFieldId = String(fieldId);
        this.curNote.update((note) => {
            if (!note) {
                return note;
            }

            const fields = note.fields;
            const nextFields = fields.map((field) => {
                if (field.id !== targetFieldId) {
                    return field;
                }
                return {
                    ...field,
                    value,
                };
            });

            return {
                ...note,
                fields: nextFields,
            };
        });
    }

    /**
     * Move to the next processing note in the local queue.
     */
    async moveToNextNote(): Promise<void> {
        if (!this.beginLoading()) {
            return;
        }

        try {
            this.pcsNoteRefs.update((refs) => refs.slice(1));
            await this.loadCurPcsNote();
        } finally {
            this.endLoading();
        }
    }

    /**
     * Save current note content draft and advance to the next queued note.
     */
    async saveDraft(): Promise<void> {
        // TODO
        this.notify.open(
            this.translate.instant(
                "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE.SUCCESS",
            ),
        );
        await this.moveToNextNote();
    }

    /**
     * Load current processing note detail and its note template.
     */
    private async loadCurPcsNote(): Promise<void> {
        const ref = this.curRef();
        if (!ref) {
            this.curNote.set(null);
            return;
        }

        const note = await window.service.pcsNote.getProcessingNoteById(ref.id);
        this.curNote.set(note);

        if (!note) {
            return;
        }

        await this.benchState.loadNoteTplRefs(note.noteTplId);
    }

    /**
     * Try to lock processing note loading before async work starts.
     */
    private beginLoading(): boolean {
        if (this.isLoading()) {
            return false;
        }
        this.isLoading.set(true);
        return true;
    }

    /**
     * Release processing note loading lock.
     */
    private endLoading(): void {
        this.isLoading.set(false);
    }
}
