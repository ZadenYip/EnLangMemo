import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
    MatDialogActions,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
    MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

export interface InputNameDialogData {
    title: string;
    label: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    initialValue?: string;
}

@Component({
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatFormFieldModule,
        MatInputModule,
        TranslateModule,
    ],
    templateUrl: "./dialog.component.html",
    styleUrl: "./dialog.component.scss",
})
export class InputNameDialog {
    private readonly dialogRef = inject(MatDialogRef<InputNameDialog, string | null>);
    private readonly translate = inject(TranslateService);
    private readonly data = inject(MAT_DIALOG_DATA) as InputNameDialogData;

    /**
     * User input for template name.
     */
    name = this.data.initialValue ?? "";

    get title(): string {
        return this.data.title;
    }

    get label(): string {
        return this.data.label;
    }

    get message(): string | null {
        return this.data.message ?? null;
    }

    get confirmText(): string {
        return this.data.confirmText ?? this.translate.instant("DIALOG.CONFIRM");
    }

    get cancelText(): string {
        return this.data.cancelText ?? this.translate.instant("DIALOG.CANCEL");
    }

    /**
     * Whether current name is empty after trim.
     */
    get isNameEmpty(): boolean {
        return this.name.trim().length === 0;
    }

    /**
     * Confirm and close dialog with normalized name.
     */
    onConfirm(): void {
        const normalizedName = this.name.trim();
        if (!normalizedName) {
            return;
        }
        this.dialogRef.close(normalizedName);
    }

    /**
     * Cancel this input dialog.
     */
    onCancel(): void {
        this.dialogRef.close(null);
    }
}
