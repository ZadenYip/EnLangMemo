import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogTitle, MatDialogActions } from "@angular/material/dialog";
import { TranslateModule } from "@ngx-translate/core";

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
    dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
    data = inject(MAT_DIALOG_DATA);

    get title(): string {
        return this.data?.title || "确认删除";
    }

    get message(): string {
        return this.data?.message || "确定要删除吗？";
    }

    get confirmText(): string {
        return this.data?.confirmText || "删除";
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
