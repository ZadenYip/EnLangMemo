import { Component, computed, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LearnSessionService } from "./learn-session.service";

@Component({
    selector: "app-learn-start",
    standalone: true,
    imports: [
        MatButtonModule,
        TranslateModule,
    ],
    templateUrl: "./learn-start.component.html",
    styleUrl: "./learn-start.component.scss",
})
export class LearnStartComponent {
    /** Shared learning session loaded by the parent route. */
    private readonly learnSession = inject(LearnSessionService);

    /** Router used to enter the active learning child route. */
    private readonly router = inject(Router);

    /** Current child route used for relative navigation. */
    private readonly route = inject(ActivatedRoute);

    /** Deck overview shown before starting a learning session. */
    readonly deck = computed(() => this.learnSession.deck()!);

    /** Total cards currently in learning or relearning queues. */
    readonly learningCards = computed(() => {
        const deck = this.deck();
        return deck.learning + deck.relearning;
    });

    /** New cards that can actually be learned in this session. */
    readonly learnableNewCards = computed(() => {
        const deck = this.deck();
        if (deck.canLearnToday < 0) {
            return deck.newCards;
        }
        return Math.min(deck.canLearnToday, deck.newCards);
    });

    /** Navigate to the active learning route. */
    startLearning(): void {
        void this.router.navigate(["../learning"], {
            relativeTo: this.route,
        });
    }
}
