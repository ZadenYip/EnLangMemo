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
import type { DicImpResult, ImportResult } from "@main/db/import/dictionary/dic-import-types";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, startWith } from "rxjs";
import Logger from "electron-log/renderer";

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
        dictionary: new FormControl("", Validators.required),
    });

    private __formInvalid = toSignal(this.form.statusChanges.pipe(
        startWith(this.form.status),
        map(() => this.form.invalid)
    ));
    readonly isImporting = signal(false);
    readonly isSubmitDisabled = computed(() => this.__formInvalid() || this.isImporting());
    progressValue = 0;

    dicImpResult: DicImpResult | null = null;

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
        this.dataSource = [];

        try {
            const { dictionary } = this.form.value;
            await this.importDictionaryWithProgress(dictionary ?? "");

            // Add a small delay to ensure that the progress bar visually reaches 100% before showing the results
            await new Promise((resolve) => setTimeout(resolve, 500));

            this.dataSource = this.buildResultRows();
            Logger.info("Dictionary import completed successfully.", this.dicImpResult);
        } finally {
            this.isImporting.set(false);
            this.progressValue = 0;
        }
    }

    private importDictionaryWithProgress(dictionaryPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            window.observables.dic.importDictionary$(dictionaryPath).subscribe({
                next: (progress) => {
                    this.progressValue = progress.progress;
                    if (progress.result) {
                        this.dicImpResult = progress.result;
                    }
                },
                error: (error) => {
                    reject(error);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }

    private buildResultRows(): LabeledImportResult[] {
        return [
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.WORDS",
                ...this.toRowValues(this.dicImpResult?.words ?? null),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.POSES",
                ...this.toRowValues(this.dicImpResult?.wordPoses ?? null),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.DEFS",
                ...this.toRowValues(this.dicImpResult?.definitions ?? null),
            },
            {
                itemLabelKey: "PAGES.BROWSE.DIC_IMPORT.EXPS",
                ...this.toRowValues(this.dicImpResult?.examples ?? null),
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
