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
import { ConfirmDeleteDialog, ConfirmDeleteDialogData, InputNameDialog, InputNameDialogData } from "@render/shared/components";
import { MatDialog } from "@angular/material/dialog";

/**
 * Available actions emitted by the card template ops menu.
 */
export type CardTplOpsAction = "create" | "delete";

@Component({
    selector: "app-card-tpl-ops",
    imports: [SelectDropdownComponent, MatMenuModule, MatIconModule, MatButtonModule, TranslateModule],
    templateUrl: "./card-tpl-ops.component.html",
    styleUrl: "./card-tpl-ops.component.scss",
    standalone: true,
})
export class CardTplOpsComponent {
    private readonly translate = inject(TranslateService);
    private readonly dialog = inject(MatDialog);
    private readonly settingDialog = inject(SettingsDialogService);
    private readonly notify = inject(NotifyService);
    private readonly noteTplService = inject(NoteTplService);

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

    /**
     * Reload card-template options from NoteTplService cache.
     */
    syncFromService(opts: SelectDropdownOption[]): void {
        this.opts = opts;
        this.selected = opts[0] ?? createEmptyOption();
        this.selectedChange.emit(this.selected);
    }

    pickCardTpl(option: SelectDropdownOption): void {
        this.selected = option;
        this.selectedChange.emit(option);
    }

    /**
     * Create card template from dialog input and refresh current options.
     */
    async createCardTpl(): Promise<void> {
        const dialogRef = this.settingDialog.open<InputNameDialog, InputNameDialogData, string>(InputNameDialog, {
            data: {
                title: this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_CARD_DIALOG.TITLE"),
                label: this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_CARD_DIALOG.FIELDS.CREATE_NAME"),
            },
        });
        const templateName = await firstValueFrom(dialogRef.afterClosed());
        if (!templateName) {
            return;
        }

        const result = await this.noteTplService.createCardTpl(templateName);
        switch (result.state) {
            case "success": {
                const msg = this.translate.instant(
                    "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_CARD_DIALOG.SUCCESS",
                    { name: templateName },
                );
                this.notify.open(msg);
                const opts = this.noteTplService.getCardTplOptions();
                this.syncFromService(opts);
                const target = opts.find((opt) => opt.label === templateName);
                if (target) {
                    this.pickCardTpl(target);
                }
                return;
            }
            case "duplicate":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_CARD_DIALOG.DUPLICATE"),
                );
                return;
            case "not-found":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.CREATE_CARD_DIALOG.NO_NOTE_SELECTED"),
                );
                return;
        }
    }

    /**
     * Delete currently selected card template after confirmation.
     */
    async delCurCardTpl(): Promise<void> {
        const selectedTpl = this.selected;
        if (!selectedTpl.value) {
            this.notify.open(
                this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.NO_SELECTION"),
            );
            return;
        }

        const tplName = selectedTpl.label ?? selectedTpl.value;
        const title = this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.TITLE");
        const message = this.translate.instant(
            "PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.MESSAGE",
            { name: tplName },
        );
        const confirmed = await firstValueFrom<boolean>(
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

        const result = await this.noteTplService.deleteCardTpl(selectedTpl.value);
        switch (result.state) {
            case "success":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.SUCCESS", {
                        name: tplName,
                    }),
                );
                this.syncFromService(this.noteTplService.getCardTplOptions());
                return;
            case "last-one":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.LAST_ONE"),
                );
                return;
            case "not-found":
                this.notify.open(
                    this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.DELETE_CARD_DIALOG.NOT_FOUND"),
                );
                return;
        }
    }

    onMenuAction(action: CardTplOpsAction): void {
        switch (action) {
            case "create":
                void this.createCardTpl();
                return;
            case "delete":
                void this.delCurCardTpl();
                return;
        }
    }
}
