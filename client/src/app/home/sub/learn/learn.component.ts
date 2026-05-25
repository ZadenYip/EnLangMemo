import { Component, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { APP_PATHS } from "../../../root-route";
import { LearnStateService } from "./learn-state.service";
import Logger from "electron-log/renderer";

@Component({
    selector: "app-learn",
    standalone: true,
    imports: [
        MatButtonModule,
        RouterOutlet,
        TranslateModule,
    ],
    providers: [
        LearnStateService,
    ],
    templateUrl: "./learn.component.html",
    styleUrl: "./learn.component.scss",
})
export class LearnComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    /** Shared learning route state loaded once by the parent route. */
    readonly learnState = inject(LearnStateService);

    /** Load the deck overview when entering /deck/:deck-id/*. */
    ngOnInit(): void {
        Logger.info("Entering learn route, loading deck for learning");
        const deckId = this.route.snapshot.paramMap.get("deck-id");
        if (!deckId) {
            Logger.error(`No deck id provided in learn route, 
                it shouldn't be possible to reach this page without a deck id.
                Returning to deck list.`);
            this.backToDecks();
            return;
        }
        void this.loadDeck(deckId);
    }

    /** Return to the deck list page. */
    backToDecks(): void {
        void this.router.navigate([APP_PATHS.deck]);
    }

    /** Load current deck state and leave the learning route if no deck is found. */
    private async loadDeck(deckId: string): Promise<void> {
        await this.learnState.loadDeck(deckId);
    }
}
