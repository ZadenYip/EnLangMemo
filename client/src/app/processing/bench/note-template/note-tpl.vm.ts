import { inject, Injectable, signal } from "@angular/core";
import { SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { SettingsDialogService } from "@render/shared/services/settings-dialog.service";
import { NotifyService } from "@render/shared/services/notify.service";
import { CreateNoteTplDialog } from "./note-tpl-ops/dialog/create-note-tpl";
import { firstValueFrom } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDeleteDialog, ConfirmDeleteDialogData } from "@render/shared/components";
import { NoteTplOpsAction } from "./note-tpl-ops/note-tpl-ops.component";
import { NoteTplService } from "./note-tpl.service";

/**
 * Sections of a note template that can be edited.
 */
export type CardTplSection = "front" | "back" | "css";

@Injectable()
export class NoteTplVm {
    private readonly translate = inject(TranslateService);
    private readonly dialog = inject(MatDialog);
    private readonly settingDialog = inject(SettingsDialogService);
    private readonly notify = inject(NotifyService);
    private readonly noteTplService = inject(NoteTplService);

    /**
     * Placeholder option for note template dropdown when no templates are available.
     */
    private readonly placeholderNoteTplOpt: SelectDropdownOption = {
        value: "",
        labelKey: "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.NOTE_TPL_OPS_MENU.DEFAULT",
    };

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
    noteTplOpts = signal<SelectDropdownOption[]>([this.placeholderNoteTplOpt]);

    /**
     * Currently selected card template option.
     */
    selCardTpl = signal<SelectDropdownOption>(this.cardTplOpts[0]);

    /**
     * Currently selected note template option.
     */
    selNoteTpl = signal<SelectDropdownOption>(this.placeholderNoteTplOpt);

    /**
     * Selected note template section.
     */
    section = signal<CardTplSection>("front");

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

    constructor() {
        void this.loadNoteTplOpts();
    }

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
    setSection(section: CardTplSection): void {
        this.section.set(section);
    }

    /**
     * Handle note-template operation menu actions.
     */
    handleNoteTplAction(action: NoteTplOpsAction): void {
        switch (action) {
            case "add":
                void this.createNoteTpl();
                return;
            case "delete":
                void this.deleteCurrentNoteTpl();
                return;
            case "settings":
                this.openNoteTplSettings();
                return;
        }
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

        const result = await this.noteTplService.createNoteTpl(templateName);
        switch (result.state) {
            case "success": {
                const msg = this.translate.instant(
                    "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_NOTE_DIALOG.SUCCESS",
                    { name: templateName },
                );
                this.notify.open(msg);
                await this.loadNoteTplOpts();
                return;
            }
            case "duplicate":
                this.notify.open(
                    this.translate.instant(
                        "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_NOTE_DIALOG.DUPLICATE",
                    ),
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

    /**
     * Delete currently selected note template after user confirmation.
     */
    async deleteCurrentNoteTpl(): Promise<void> {
        const selectedTpl = this.selNoteTpl();
        if (!selectedTpl.value) {
            this.notify.open(
                this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.NO_SELECTION"),
            );
            return;
        }

        const tplName = selectedTpl.label ?? selectedTpl.value;
        const title = this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.TITLE");
        const message = this.translate.instant(
            "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.MESSAGE",
            { name: tplName },
        );

        const confirmed = await firstValueFrom(
            this.dialog.open<ConfirmDeleteDialog, ConfirmDeleteDialogData>(ConfirmDeleteDialog, {
                data: {
                    title,
                    message,
                },
            }).afterClosed(),
        );

        if (!confirmed) {
            return;
        }

        const result = await this.noteTplService.deleteNoteTpl(selectedTpl.value);
        switch (result.state) {
            case "success":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.SUCCESS", {
                        name: tplName,
                    }),
                );
                await this.loadNoteTplOpts();
                return;
            case "not-found":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.NOT_FOUND"),
                );
                await this.loadNoteTplOpts();
                return;
            case "last-one":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.LAST_ONE"),
                );
                await this.loadNoteTplOpts();
                return;
        }
    }

    /**
     * Load all note templates and map to dropdown options.
     */
    private async loadNoteTplOpts(): Promise<void> {
        const noteTpls = await this.noteTplService.loadAllNoteTpls();
        const loadedOpts: SelectDropdownOption[] = noteTpls.map((tpl) => ({
            value: tpl.id,
            label: tpl.name,
        }));
        const nextOpts = loadedOpts.length > 0 ? loadedOpts : [this.placeholderNoteTplOpt];
        this.noteTplOpts.set(nextOpts);
        const currentSelected = this.selNoteTpl();
        const matchedSelected = nextOpts.find((opt) => opt.value === currentSelected.value);
        this.selNoteTpl.set(matchedSelected ?? nextOpts[0]);
    }
}
