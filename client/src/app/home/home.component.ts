import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, inject, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";
import Logger from "electron-log";
import { Deck, DeckSettings } from "@main/db/services/repetition/deck/deck-service-types";
import { ConfirmDeleteDialog, ConfirmDeleteDialogData } from "../shared/components";
import { NotifyService } from "../shared/services/notify.service";
import { SettingsDialogService } from "../shared/services/settings-dialog.service";
import { DeckConfigComponent } from "./sub/deck-config/config.component";
import { DeckSettingsComponent } from "./sub/settings/settings.component";
import { DeckService } from "./deck/service";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    standalone: true,
    imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    FormsModule,
    DeckSettingsComponent,
    RouterLink
],
})
export class HomeComponent implements OnInit {
    readonly deckService = inject(DeckService);
    private static readonly maxDeckNameChars = 32;

    private readonly router = inject(Router);

    private readonly dialog = inject(MatDialog);
    private readonly translateService = inject(TranslateService);
    /** Notification service for snack bar messages. */
    private readonly notify = inject(NotifyService);
    /** Settings dialog service for default-sized dialogs. */
    private readonly settingsDialog = inject(SettingsDialogService);

    
    /** Pending deck name to create. */
    pendingDeckName = "";
    createInputElem = viewChild<ElementRef<HTMLInputElement>>("createInput");

    ngOnInit(): Promise<void> {
        Logger.info("Home deck material view initialized");
        return this.loadDecks();
    }

    private async loadDecks(): Promise<void> {
        await this.deckService.reloadDecks();
    }

    
    // TODO
    async openDeckSettings(deck: Deck): Promise<void> {
        const settings = await window.service.deck.getDeckSettings(deck.id);
        const result = await firstValueFrom(
            this.settingsDialog
                .open(DeckConfigComponent, {
                    data: {
                        deckName: deck.name,
                        settings,
                    },
                })
                .afterClosed()
        );

        if (!result) {
            return;
        }
        const newSettings = result as DeckSettings;
        await window.service.deck.updateDeckSettings(deck.id, newSettings);
    }

    /**
     * Confirm and delete a deck, then refresh the list.
     * @param deck the deck to be deleted emitted from subcomponent.
     */
    async confirmDeleteDeck(deck: Deck): Promise<void> {
        const title = this.translateService.instant("PAGES.HOME.DECKS.DELETE_TITLE");
        const message = this.translateService.instant("PAGES.HOME.DECKS.DELETE_CONFIRM", {
            name: deck.name,
        });
        const confirmed = await firstValueFrom(
            this.dialog.open<ConfirmDeleteDialog, ConfirmDeleteDialogData>(ConfirmDeleteDialog, {
                data: {
                    title,
                    message,
                },
            }).afterClosed()
        );
        if (!confirmed) {
            return;
        }
        try {
            await window.service.deck.deleteDeck(deck.id);
        } catch (error) {
            Logger.error("Failed to delete deck", {
                deckId: deck.id,
                deckName: deck.name,
                error,
            });
            return;
        }
        this.notify.open(
            this.translateService.instant("PAGES.HOME.DECKS.DELETE_SUCCESS", {
                name: deck.name,
            })
        );
        await this.loadDecks();
    }

    /**
     * Handles the input event for the deck name field.
     * @param event The input event.
     */
    onInputDeckName(event: Event): void {
        const input = event.target as HTMLInputElement;
        const normalizedName = this.limitDeckName(input.value);
        if (normalizedName !== input.value) {
            input.value = normalizedName;
            const msg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_NAME_TOO_LONG", {
                max: HomeComponent.maxDeckNameChars,
            });
            this.notify.open(msg);
        }
        this.pendingDeckName = normalizedName;
        if (!this.pendingDeckName.trim()) {
            this.pendingDeckName = "";
            const msg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_NAME_EMPTY");
            this.notify.open(msg);
            return;
        }
    }
    
    /**
     * Cancel the deck creation process and clear the pending deck name.
     */
    cancelCreateDeck(): void {
        this.resetCreateDeckInput();
    }

    resetCreateDeckInput(): void {
        this.pendingDeckName = "";
        this.createInputElem()!.nativeElement.value = "";
    }

    /**
     * Confirm and create a new deck, then refresh the list.
     */
    async confirmCreateDeck(): Promise<void> {
        const deckName = this.limitDeckName(this.pendingDeckName);
        if (!deckName.trim()) {
            const msg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_NAME_EMPTY");
            this.resetCreateDeckInput();
            this.notify.open(msg);
            return;
        }
        if (deckName !== this.pendingDeckName) {
            this.pendingDeckName = deckName;
            this.createInputElem()!.nativeElement.value = deckName;
            const msg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_NAME_TOO_LONG", {
                max: HomeComponent.maxDeckNameChars,
            });
            this.notify.open(msg);
            return;
        }
        Logger.info(`confirm create deck with name: ${deckName}`);
        const result = await window.service.deck.createDeck(deckName);
        switch (result.state) {
            case "success": {
                Logger.info("Deck created successfully", {
                    deckName,
                });
                const successMsg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_SUCCESS", {
                    name: deckName,
                });
                this.notify.open(successMsg);
                await this.loadDecks();
                break;
            }
            case "duplicate": {
                Logger.info("Deck creation failed due to duplicate name", {
                    deckName,
                });
                const duplicateMsg = this.translateService.instant("PAGES.HOME.DECKS.CREATE_DUPLICATE");
                this.notify.open(duplicateMsg);
                break;
            }
            case "error": {
                Logger.error("Failed to create deck", {
                    deckName,
                    errorMessage: result.errorMessage,
                });
                break;
            }
        }
        this.pendingDeckName = "";
    }

    private limitDeckName(name: string): string {
        return Array.from(name).slice(0, HomeComponent.maxDeckNameChars).join("");
    }

}
