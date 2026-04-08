import { Component, computed, signal } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { TranslateModule } from "@ngx-translate/core";
import { FileInputComponent } from "../file-input/file-input.component";
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import type { ImportResult } from "@main/db/import/dictionary/dic-import-type";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, startWith } from "rxjs";

type LabeledImportResult = ImportResult & { itemLabelKey: string };

@Component({
    selector: "app-dic-import",
    imports: [
    TranslateModule,
    MatCardModule,
    FileInputComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatTableModule,
    MatProgressBarModule
],
    templateUrl: "./dic-import.component.html",
    styleUrl: "./dic-import.component.scss",
})
export class DicImportComponent {
    form = new FormGroup({
        words: new FormControl("", Validators.required),
        poses: new FormControl("", Validators.required),
        defs: new FormControl("", Validators.required),
        exps: new FormControl("", Validators.required),
    });

    private __formInvalid = toSignal(this.form.statusChanges.pipe(
        startWith(this.form.status),
        map(() => this.form.invalid)
    ));
    readonly isImporting = signal(false);
    readonly isSubmitDisabled = computed(() => this.__formInvalid() || this.isImporting());
    progressValue = 0;

    wordsImportResult: ImportResult | null = null;
    posesImportResult: ImportResult | null = null;
    defsImportResult: ImportResult | null = null;
    expsImportResult: ImportResult | null = null;

    displayedColumns: string[] = ["item", "total", "processed", "skipped", "failed"];
    dataSource: LabeledImportResult[] = [];

    /**
     * Handle form submission for dictionary import. This method will be called when the user submits the form.
     */
    async onSubmit(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        this.isImporting.set(true);

        const { words, poses, defs, exps } = this.form.value;
        this.wordsImportResult = await window.service.dicService.importWords(
            words ?? ""
        );
        this.progressValue = 25;

        this.posesImportResult = await window.service.dicService.importWordPoses(
            poses ?? ""
        );
        this.progressValue = 50;

        this.defsImportResult = await window.service.dicService.importDefinitions(
            defs ?? ""
        );
        this.progressValue = 75;

        this.expsImportResult = await window.service.dicService.importExamples(
            exps ?? ""
        );
        this.progressValue = 100;

        // Add a small delay to ensure that the progress bar visually reaches 100% before showing the results
        await new Promise((resolve) => setTimeout(resolve, 500));

        this.dataSource = this.buildResultRows();
        this.isImporting.set(false);
        this.progressValue = 0;
    }

    private buildResultRows(): LabeledImportResult[] {
        return [
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.WORDS",
                ...this.toRowValues(this.wordsImportResult),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.POSES",
                ...this.toRowValues(this.posesImportResult),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.DEFS",
                ...this.toRowValues(this.defsImportResult),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.EXPS",
                ...this.toRowValues(this.expsImportResult),
            },
        ];
    }

    private toRowValues(result: ImportResult | null): ImportResult {
        if (!result) {
            return {
                total: 0,
                processed: 0,
                skipped: 0,
                failed: 0,
            };
        }

        return {
            total: result.total,
            processed: result.processed,
            skipped: result.skipped,
            failed: result.failed,
        };
    }
}
