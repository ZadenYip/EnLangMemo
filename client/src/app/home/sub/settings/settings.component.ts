import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { TranslateModule } from "@ngx-translate/core";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";

@Component({
	selector: "app-deck-settings-menu",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, TranslateModule],
})
export class DeckSettingsComponent {
	
	deck = input<Deck>();
	/**
	 * triggered when the user clicks the "Configure" button in the menu.
	 */
	configure = output<Deck>();

	/**
	 * triggered when the user clicks the "Delete" button in the menu.
	 */
	delete = output<Deck>();

	/**
	 * triggers by clicking the "Configure" button
	 */
	onConfigure(): void {
		const deck = this.deck();
		if (!deck) {
			return;
		}
		this.configure.emit(deck);
	}

	/**
	 * triggers by clicking the "Delete" button
	 */
	onDelete(): void {
		const deck = this.deck();
		if (!deck) {
			return;
		}
		this.delete.emit(deck);
	}
}