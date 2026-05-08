import { inject, Injectable, signal } from "@angular/core";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { SettingsDialogService } from "@render/shared/services/settings-dialog.service";
import { NotifyService } from "@render/shared/services/notify.service";
import { CreateNoteTplDialog } from "./note-tpl-ops/dialog/create-note-tpl";
import { firstValueFrom } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

type NoteTplSection = "front" | "back" | "css";

@Injectable()
export class NoteTplProvider {
    private translate = inject(TranslateService);   
    private settingDialog = inject(SettingsDialogService);
    private notify = inject(NotifyService);
    /**
     * Dropdown options for card templates.
     */
    cardTplOpts: SelectDropdownOption[] = [
        {
            value: "template-a",
            labelKey: "testa",
        },
        {
            value: "template-b",
            labelKey: "testb",
        },
    ];

    /**
     * Dropdown options for note templates.
     */
    noteTplOpts: SelectDropdownOption[] = [
        {
            value: "default-note-template",
            labelKey: "默认",
        },
    ];

    /**
     * Currently selected card template option.
     */
    selCardTpl = signal<SelectDropdownOption>(this.cardTplOpts[0]);

    /**
     * Currently selected note template option.
     */
    selNoteTpl = signal<SelectDropdownOption>(this.noteTplOpts[0]);

    /**
     * Selected note template section.
     */
    section = signal<NoteTplSection>("front");

    /**
     * Front template HTML content.
     */
    frontTpl = signal("");

    /**
     * Back template HTML content.
     */
    backTpl = signal("");

    /**
     * CSS template content.
     */
    cssTpl = signal("");

    /**
     * Update the current card template selection.
     */
    pickCardTpl(option: SelectDropdownOption): void {
        this.selCardTpl.set(option);
    }

    /**
     * UI placeholder for creating a card template.
     */
    addCardTpl(): void {
        // TODO: Implement behavior in the data layer.
    }

    /**
     * Update the current note template selection.
     */
    pickNoteTpl(option: SelectDropdownOption): void {
        this.selNoteTpl.set(option);
    }

    /**
     * Switch the active template section.
     */
    setSection(section: NoteTplSection): void {
        this.section.set(section);
    }

    /**
     * UI placeholder for creating a note template.
     */
    async createNoteTpl(): Promise<void> {
        const dialogRef = this.settingDialog.open<CreateNoteTplDialog, unknown, string>(CreateNoteTplDialog);

        const templateName = await firstValueFrom(dialogRef.afterClosed());
        if (!templateName) {
            return;
        }

        const result = await window.service.nt.createNoteTpl(templateName);
        switch (result.state) {
            case "success": {
                const msg = this.translate.instant(
                    "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_NOTE_DIALOG.SUCCESS",
                    { name: templateName },
                );
                this.notify.open(msg);
                return;
            }
            case "duplicate":
                this.notify.open(
                    "A note template with the same name already exists.",
                );
                return;
            case "error":
                this.notify.open(
                    `Failed to create note template: ${result.errorMessage}`,
                );
                return;
        }
    }

    /**
     * UI placeholder for note-template settings.
     */
    openNoteTplSettings(): void {
        // TODO: Implement behavior in the data layer.
    }
}