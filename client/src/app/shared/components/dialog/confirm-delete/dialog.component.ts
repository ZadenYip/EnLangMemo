import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogTitle, MatDialogActions } from "@angular/material/dialog";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

export interface ConfirmDeleteDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

@Component({
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        TranslateModule,
    ],
    templateUrl: "./dialog.component.html",
    styleUrl: "./dialog.component.scss",
})
export class ConfirmDeleteDialog {
    private dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
    private translate = inject(TranslateService);
    private data = inject(MAT_DIALOG_DATA) as ConfirmDeleteDialogData;

    get title(): string {
        return this.data.title;
    }

    get message(): string {
        return this.data.message;
    }

    get confirmText(): string {
        return this.data.confirmText ?? this.translate.instant("DIALOG.DELETE");
    }

    get cancelText(): string {
        return this.data.cancelText ?? this.translate.instant("DIALOG.CANCEL");
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
