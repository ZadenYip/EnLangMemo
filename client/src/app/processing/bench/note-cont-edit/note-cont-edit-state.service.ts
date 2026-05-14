import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { NotifyService } from "@render/shared/services/notify.service";
import { BenchStateService } from "../bench-state.service";

@Injectable()
export class NoteContEditStateService {
    private readonly benchState = inject(BenchStateService);
    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);

    /**
     * Current note template fields used to build the note content form.
     */
    readonly fields = computed(
        () => this.benchState.curNoteTpl()?.fields ?? [],
    );

    /**
     * Draft note field values keyed by template field id.
     */
    readonly fieldValues = signal<Record<string, string>>({});

    constructor() {
        effect(() => {
            const fields = this.fields();
            this.fieldValues.update((currentValues) => {
                const newFieldValues: Record<string, string> = {};
                fields.forEach((field) => {
                    newFieldValues[String(field.id)] =
                        currentValues[String(field.id)] ?? "";
                });
                return newFieldValues;
            });
        });
    }

    /**
     * Read a field draft value for textarea binding.
     */
    fieldValue(fieldId: number): string {
        return this.fieldValues()[String(fieldId)] ?? "";
    }

    /**
     * Update a single note field draft value.
     */
    updateFieldValue(fieldId: number, value: string): void {
        this.fieldValues.update((currentValues) => ({
            ...currentValues,
            [String(fieldId)]: value,
        }));
    }

    /**
     * Save current note content draft.
     */
    saveDraft(): void {
        this.notify.open(
            this.translate.instant(
                "PAGES.PROCESSING.BENCH.NOTE_CONTENT_EDIT.SAVE.SUCCESS",
            ),
        );
    }
}
