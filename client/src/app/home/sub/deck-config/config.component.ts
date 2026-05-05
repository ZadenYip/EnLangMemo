import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule } from "@ngx-translate/core";
import { DeckConfig } from "@main/db/services/repetition/deck/deck-service-types";

/** Dialog data for deck config editing. */
export interface DeckConfigDialogData {
	/** Current deck name. */
	deckName: string;
	/** Current deck config values. */
	config: DeckConfig;
}

@Component({
	templateUrl: "./config.component.html",
	styleUrls: ["./config.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatFormFieldModule,
		MatInputModule,
		TranslateModule,
	],
})
export class DeckConfigComponent {
	/** Dialog reference for closing with optional result. */
	private readonly dialogRef = inject(MatDialogRef<DeckConfigComponent>);

	/** Incoming dialog data. */
	private readonly data = inject<DeckConfigDialogData>(MAT_DIALOG_DATA);

	/** Deck name for the dialog title. */
	readonly deckName = this.data.deckName;

	/** Editable deck config model. */
	readonly config: DeckConfig = {
		...this.data.config
	};

	/** Close the dialog without saving. */
	onCancel(): void {
		this.dialogRef.close(null);
	}

	/** Close the dialog and return updated config. */
	onSave(): void {
		this.dialogRef.close(
            this.config
        );
	}
}
