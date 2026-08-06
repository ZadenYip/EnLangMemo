import { Injectable, signal } from "@angular/core";
import { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types";
import {
    createEmptyOption,
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";
import Logger from "electron-log/renderer";

@Injectable()
export class BenchStateService {
    private readonly noteTplRefMap = new Map<string, SelectDropdownOption>();

    /**
     * Whether template-related async operation is running.
     */
    readonly isBusy = signal(false);

    /**
     * Available preset note template dropdown options.
     */
    readonly noteTplOptions = signal<SelectDropdownOption[]>([]);

    /**
     * Currently selected preset note template option.
     */
    readonly selectedNoteTpl = signal<SelectDropdownOption>(createEmptyOption());

    /**
     * Current loaded note template detail.
     */
    readonly curNoteTpl = signal<NoteTemplate | null>(null);

    /**
     * Load preset note template refs and select preferred or first template.
     */
    async loadNoteTplRefs(preferredNoteTplId = ""): Promise<void> {
        if (!this.beginBusy()) {
            return;
        }
        try {
            await this.loadNoteTplRefsCore(preferredNoteTplId);
        } finally {
            this.endBusy();
        }
    }

    /**
     * Select preset note template and load its editable presentation template.
     */
    async selectNoteTpl(option: SelectDropdownOption): Promise<void> {
        if (!this.beginBusy()) {
            return;
        }
        try {
            await this.selectNoteTplCore(option);
        } finally {
            this.endBusy();
        }
    }

    /**
     * Replace current note template cache after a successful template save.
     */
    replaceCurNoteTpl(noteTpl: NoteTemplate): void {
        this.curNoteTpl.set(noteTpl);
    }

    /**
     * Try to lock template operations synchronously before async work starts.
     */
    beginBusy(): boolean {
        if (this.isBusy()) {
            Logger.warn("Operation failed: busy，logically should not happen");
            return false;
        }
        this.isBusy.set(true);
        return true;
    }

    /**
     * Release template operation lock after async work completes.
     */
    endBusy(): void {
        this.isBusy.set(false);
    }

    /**
     * Load note template dropdown options and select a stable target.
     */
    private async loadNoteTplRefsCore(preferredNoteTplId = ""): Promise<void> {
        const refs = await window.service.ntTpl.getAllNoteTplRefs();
        const options = refs.map((ref) => ({
            label: ref.name,
            value: ref.id,
        }));
        this.noteTplRefMap.clear();
        options.forEach((option) => this.noteTplRefMap.set(option.value, option));
        this.noteTplOptions.set(options);

        const selected = this.noteTplRefMap.get(preferredNoteTplId) ?? options[0] ?? createEmptyOption();
        await this.selectNoteTplCore(selected);
    }

    /**
     * Apply the selected note template option and fetch its template payload.
     */
    private async selectNoteTplCore(option: SelectDropdownOption): Promise<void> {
        this.selectedNoteTpl.set(option);
        if (!option.value) {
            this.resetNoteTplState();
            return;
        }

        const noteTpl = await window.service.ntTpl.getNoteTplById(option.value);
        this.curNoteTpl.set(noteTpl);
    }

    /**
     * Clear note template state when no preset template is available.
     */
    private resetNoteTplState(): void {
        this.curNoteTpl.set(null);
    }
}
