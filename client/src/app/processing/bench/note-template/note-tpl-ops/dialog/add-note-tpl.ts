import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { TranslatePipe } from "@ngx-translate/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";


@Component({
    templateUrl: "./add-note-tpl.html",
    styleUrl: "./add-note-tpl.scss",
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
export class AddNoteTplDialog {
    private dialogRef = inject(MatDialogRef<AddNoteTplDialog>);
    tplName = "";

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
    
}