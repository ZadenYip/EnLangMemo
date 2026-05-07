import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { TranslatePipe } from "@ngx-translate/core";

export interface CreateNoteTplDialogData {
    tplName: string;
}

@Component({
    standalone: true,
    templateUrl: "./create-note-tpl.html",
    styleUrl: "./create-note-tpl.scss",
    imports: [
        FormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatFormFieldModule,
        MatInputModule,
        TranslatePipe,
    ],
})
export class CreateNoteTplDialog {
    private readonly dialogRef = inject(MatDialogRef<CreateNoteTplDialog>);
    tplName = "";

    onConfirm(): void {
        this.dialogRef.close(this.tplName);
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }
}