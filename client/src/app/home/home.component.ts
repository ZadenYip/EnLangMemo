import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";
import Logger from "electron-log";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";
import { ConfirmDeleteDialogComponent } from "../shared/components";
import { NotifyService } from "../shared/services/notify.service";
import { DeckSettingsComponent } from "./sub/deck-setting/settings.component";

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
    ],
})
export class HomeComponent implements OnInit {
    private readonly router = inject(Router);

    private readonly dialog = inject(MatDialog);
    private readonly translateService = inject(TranslateService);
    /** Notification service for snack bar messages. */
    private readonly notify = inject(NotifyService);

    deckOverviewList: Deck[] = [];
    
    /** Pending deck name to create. */
    pendingDeckName = "";

    async ngOnInit(): Promise<void> {
        Logger.info("Home deck material view initialized");
        await this.loadDecks();
    }

    /**
     * Loads the list of decks for the current collection.
     */
    private async loadDecks(): Promise<void> {
        try {
            this.deckOverviewList = await window.service.deck.listDecks();
        } catch (error) {
            Logger.error("Failed to load decks on home page", error);
            this.deckOverviewList = [];
            return;
        }
        Logger.info("Decks loaded for home page", {
            deckOverviewList: this.deckOverviewList,
        });
    }

    // TODO
    openDeckReview(deck: Deck): void {
        Logger.info("TODO: open deck review page", {
            deck,
            currentUrl: this.router.url,
        });
    }
    
    // TODO
    openDeckSettings(deck: Deck): void {
        Logger.info("TODO: open deck settings page", {
            deck,
            currentUrl: this.router.url,
        });
    }

    /**
     * Confirm and delete a deck, then refresh the list.
     * @param deck the deck to be deleted emitted from subcomponent.
     */
    async confirmDeleteDeck(deck: Deck): Promise<void> {
        const title = this.translateService.instant("PAGES.HOME.DECKS.DELETE_DIALOG.TITLE");
        const message = this.translateService.instant("PAGES.HOME.DECKS.DELETE_CONFIRM", {
            name: deck.name,
        });
        const confirmText = this.translateService.instant("PAGES.HOME.DECKS.DELETE_DIALOG.CONFIRM");
        const confirmed = await firstValueFrom(
            this.dialog.open(ConfirmDeleteDialogComponent, {
                data: {
                    title,
                    message,
                    confirmText,
                },
            }).afterClosed()
        );
        if (!confirmed) {
            return;
        }
        try {
            await window.service.deck.deleteDeck(deck.name);
        } catch (error) {
            Logger.error("Failed to delete deck", {
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
     * Cancel the deck creation process and clear the pending deck name.
     */
    cancelCreateDeck(): void {
        this.pendingDeckName = "";
    }

    /**
     * Confirm and create a new deck, then refresh the list.
     */
    async confirmCreateDeck(): Promise<void> {
        const deckName = this.pendingDeckName;
        Logger.info(`confirm create deck with name: ${deckName}`);
        try {
            const result = await window.service.deck.createDeck(deckName);
            if (result.isSuccess) {
                Logger.info("Deck created successfully", {
                    deckName,
                });
                this.notify.open(
                    this.translateService.instant("PAGES.HOME.DECKS.CREATE_SUCCESS", {
                        name: deckName,
                    })
                );
                await this.loadDecks();
            } else {
                Logger.error("Failed to create deck", {
                    deckName,
                    errorMessage: result.errorMessage,
                });
            }
        } catch (error) {
            Logger.error("Failed to create deck (unknown error)", error);
            return;
        }
        this.pendingDeckName = "";
    }

}
