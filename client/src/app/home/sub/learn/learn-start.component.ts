import { Component, computed, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule } from "@ngx-translate/core";
import { Deck } from "@main/db/services/repetition/deck/deck-service-types";

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
    /** Deck overview shown before starting a learning session. */
    readonly deck = input.required<Deck>();

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

    /** Emitted when user confirms starting the learning session. */
    readonly startRequested = output<void>();
}
