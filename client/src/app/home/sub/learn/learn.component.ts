import { Component, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { APP_PATHS } from "../../../root-route";
import { LearnSessionService } from "./learn-session.service";
import Logger from "electron-log/renderer";
import { LEARN_PATHS, LearnPath } from "./route";

@Component({
    selector: "app-learn",
    standalone: true,
    imports: [
        MatButtonModule,
        RouterOutlet,
        TranslateModule,
    ],
    providers: [
        LearnSessionService,
    ],
    templateUrl: "./learn.component.html",
    styleUrl: "./learn.component.scss",
})
export class LearnComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    /** Shared learning session loaded once by the parent route. */
    readonly learnSession = inject(LearnSessionService);

    /** Load the deck overview when entering /deck/:deck-id/*. */
    ngOnInit(): void {
        Logger.info("Entering learn route, loading deck for learning");
        const deckId = this.route.snapshot.paramMap.get("deck-id");
        if (!deckId) {
            Logger.error(`No deck id provided in learn route, 
                it shouldn't be possible to reach this page without a deck id.
                Returning to deck list.`);
            this.backToHome();
            return;
        }
        void this.initPage(deckId);
    }

    /** Return to the main deck page. */
    backToHome(): void {
        void this.router.navigate([APP_PATHS.deck]);
    }

    /** Load current deck state and redirect completed decks to the completed route. */
    private async initPage(deckId: string): Promise<void> {
        await this.learnSession.loadDeck(deckId);
        if (this.learnSession.loadFailed()) {
            return;
        }

        // Redirect to the completed page if the deck is already completed.
        if (this.learnSession.isDeckCompleted()) {
            void this.navigateTo(LEARN_PATHS.completed);
        }
    }

    /** Navigate to one of the learning child routes. */
    public async navigateTo(path: LearnPath): Promise<void> {
        await this.router.navigate([path], {
            relativeTo: this.route,
        });
    }
    
}
