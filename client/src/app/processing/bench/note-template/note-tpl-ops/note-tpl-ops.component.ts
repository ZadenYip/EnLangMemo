import { Component, inject, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { createEmptyOption, SelectDropdownComponent, SelectDropdownOption } from "@render/shared/components/select-dropdown/select-dropdown.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { NoteTplService } from "../note-tpl.service";
import { SettingsDialogService } from "@render/shared/services/settings-dialog.service";
import { NotifyService } from "@render/shared/services/notify.service";
import { firstValueFrom } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDeleteDialog, ConfirmDeleteDialogData } from "@render/shared/components";
import { CreateNoteTplDialog } from "./dialog/create-note-tpl";

/**
 * Available actions emitted by the note template ops menu.
 */
export type NoteTplOpsAction = "add" | "delete" | "settings";

@Component({
    selector: "app-note-tpl-ops",
    imports: [SelectDropdownComponent, MatMenuModule, MatIconModule, MatButtonModule, TranslateModule],
    templateUrl: "./note-tpl-ops.component.html",
    styleUrl: "./note-tpl-ops.component.scss",
    standalone: true,
})
export class NoteTplOpsComponent {
    /**
     * Dropdown options for note templates.
     */
    opts: SelectDropdownOption[] = [];
    /**
     * Currently selected note template option.
     */
    selected = createEmptyOption();

    /**
     * Emits when the selected note template changes.
     */
    selectedChange = output<SelectDropdownOption>();

    private readonly translate = inject(TranslateService);
    private readonly dialog = inject(MatDialog);
    private readonly settingDialog = inject(SettingsDialogService);
    private readonly notify = inject(NotifyService);
    private noteTplService = inject(NoteTplService);

    constructor() {
        void this.loadNoteTplRefs();
    }

    private async loadNoteTplRefs(selectedId = ""): Promise<void> {
        const noteTplRefs = await this.noteTplService.loadAllNoteTplRefs(selectedId);
        const opts = noteTplRefs.map((ref) => ({
            label: ref.name,
            value: ref.id,
        }));
        this.opts = opts;
        const selectedOpt = this.noteTplService.getNoteTplRefById(selectedId);
        this.selected = selectedOpt ? {
            label: selectedOpt.name,
            value: selectedOpt.id
        } : createEmptyOption();
        this.selectedChange.emit(this.selected);
    }

    private async selectNoteTpl(option: SelectDropdownOption): Promise<void> {
        await this.noteTplService.loadNoteTplById(option.value);
        this.selected = option;
        this.selectedChange.emit(option);
    }


    /**
     * Create a note template from dialog input and refresh current options.
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

                await this.loadNoteTplRefs(this.selected.value);
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
     * Delete currently selected note template after confirmation.
     */
    async delCurNoteTpl(): Promise<void> {
        const selectedTpl = this.selected;
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
                await this.loadNoteTplRefs();
                return;
            case "not-found":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.NOT_FOUND"),
                );
                return;
            case "last-one":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_NOTE_DIALOG.LAST_ONE"),
                );
                return;
        }
    }

    /**
     * Handle actions from menu.
     */
    onMenuAction(action: NoteTplOpsAction): void {
        switch (action) {
            case "add":
                void this.createNoteTpl();
                return;
            case "delete":
                void this.delCurNoteTpl();
                return;
            case "settings":
                // TODO implement note template settings ?
                return;
        }
    }

    pickNoteTpl(option: SelectDropdownOption): void {
        void this.selectNoteTpl(option);
    }

}
