import { computed, inject, Injectable, signal } from "@angular/core";
import { PcsNote, PcsNoteRef } from "@main/db/services/repetition/processing-note/pcs-note-types";
import { TranslateService } from "@ngx-translate/core";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { NotifyService } from "@render/shared/services/notify.service";
import { BenchStateService } from "../bench-state.service";

@Injectable()
export class NoteContEditStateService {
    private readonly benchState = inject(BenchStateService);
    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);

    /**
     * Empty deck option shown when no deck can be selected.
     */
    private readonly emptyDeckOption: SelectDropdownOption = {
        value: "",
        labelKey: "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.DECK_SELECT.PLACEHOLDER",
    };

    /**
     * Processing note references waiting to be edited.
     */
    readonly pcsNoteRefs = signal<PcsNoteRef[]>([]);

    /**
     * Current loaded processing note detail.
     */
    readonly curNote = signal<PcsNote | null>(null);

    /**
     * Whether processing note loading is running.
     */
    readonly isLoading = signal(false);

    /**
     * Available deck options for saving edited notes as cards.
     */
    readonly deckOptions = signal<SelectDropdownOption[]>([]);

    /**
     * Currently selected deck option for card creation.
     */
    readonly selectedDeck = signal<SelectDropdownOption>(this.emptyDeckOption);

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
     * Whether a deck can be selected for saving current note as a card.
     */
    readonly canSelectDeck = computed(() => this.deckOptions().length > 0);

    /**
     * Load all processing note references and open the first pending note.
     */
    async reloadProcessingNotes(): Promise<void> {
        if (!this.beginLoading()) {
            return;
        }

        try {
            const refs = await window.service.pcsNote.getAllPcsNoteRefs();
            this.pcsNoteRefs.set(refs);
            await this.loadCurPcsNote();
        } finally {
            this.endLoading();
        }
    }

    /**
     * Load deck options and keep a valid deck selection.
     */
    async reloadDeckOptions(): Promise<void> {
        const decks = await window.service.deck.listDecks();
        const options = decks.map((deck) => ({
            value: deck.id,
            label: deck.name,
        }));
        this.deckOptions.set(options);

        const selectedDeck = this.selectedDeck();
        const newSelectedDeck = options.find((option) => option.value === selectedDeck.value)
            ?? options[0]
            ?? this.emptyDeckOption;
        this.selectedDeck.set(newSelectedDeck);
    }

    /**
     * Select the target deck for card creation.
     */
    selectDeck(option: SelectDropdownOption): void {
        this.selectedDeck.set(option);
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
            await this.moveToNextNoteCore();
        } finally {
            this.endLoading();
        }
    }

    /**
     * Save current note content draft to database.
     */
    async saveDraft(): Promise<void> {
        const note = this.curNote();
        if (!note) {
            return;
        }

        const result = await window.service.pcsNote.savePcsNote(note);
        switch (result.state) {
            case "success":
                break;
            default:
                this.notify.open(
                    this.translate.instant(
                        "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE.FAILED",
                    ),
                );
                return;
        }

        this.notify.open(
            this.translate.instant(
                "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE.SUCCESS",
            ),
        );
    }

    /**
     * Save current note content and run the save-to-deck service flow.
     */
    async saveToDeck(): Promise<void> {
        const note = this.curNote();
        const deckId = this.selectedDeck().value;
        if (!note || !deckId || !this.beginLoading()) {
            return;
        }

        try {
            const result = await window.service.pcsNote.savePcsNoteToDeck(
                note,
                deckId,
            );
            if (result.state !== "success") {
                this.notify.open(
                    this.translate.instant(
                        "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE_AND_ADD.FAILED",
                    ),
                );
                return;
            }
            
            await this.moveToNextNoteCore();
            this.notify.open(
                this.translate.instant(
                    "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE_AND_ADD.SUCCESS",
                    {
                        count: result.cardCount,
                    },
                ),
            );
        } finally {
            this.endLoading();
        }
    }

    /**
     * Move queue head forward without acquiring the loading lock.
     */
    private async moveToNextNoteCore(): Promise<void> {
        this.pcsNoteRefs.update((refs) => refs.slice(1));
        await this.loadCurPcsNote();
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

        const note = await window.service.pcsNote.getPcsNoteById(ref.id);
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
