import { Component, OnDestroy, OnInit, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { CardFrameComponent } from "../../../shared/components/card-frame/card-frame.component";
import { CardRenderField, renderCardDocument } from "../../../shared/card-rendering/card-template-renderer";
import { LearnSessionService } from "./learn-session.service";
import { NotifyService } from "../../../shared/services/notify.service";
import { StudyCardQueue } from "./study-card-queue";
import { LEARN_PATHS } from "./route";
// eslint-disable-next-line
// @ts-ignore
import { CardRating, StudyCard, StudyCardRatingPreviews } from "@main/db/services/repetition/cards/card-service-types";
import Logger from "electron-log/renderer";

@Component({
    selector: "app-learning",
    standalone: true,
    imports: [
        CardFrameComponent,
        MatButtonModule,
        TranslateModule,
    ],
    templateUrl: "./learning.component.html",
    styleUrl: "./learning.component.scss",
})
export class LearningComponent implements OnInit, OnDestroy {
    private readonly learnSession = inject(LearnSessionService);

    /** Router used to leave the active learning page when the deck is completed. */
    private readonly router = inject(Router);

    /** Current child route used for relative completed-page navigation. */
    private readonly route = inject(ActivatedRoute);

    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);

    /** Study card queue controller for active and fetched queues. */
    private readonly studyCardQueue = signal<StudyCardQueue | null>(null);

    /** Timestamp when the current card front side became available in the renderer. */
    private cardTimerStartedAt: number | null = null;

    /** Capped front-side duration for the current card in milliseconds. */
    private currentCardDurationMs = 0;

    /** FSRS rating values exposed for the Angular template. */
    readonly CardRating = {
        AGAIN: CardRating.AGAIN,
        HARD: CardRating.HARD,
        GOOD: CardRating.GOOD,
        EASY: CardRating.EASY,
    } as const;

    /** Whether the answer side is currently visible. */
    readonly answerVisible = signal(false);

    /** FSRS rating previews for the current card answer buttons. */
    readonly ratingPreviews = signal<StudyCardRatingPreviews | null>(null);

    /** Study cards loaded for the current deck learning session. */
    readonly studyCards = computed(() => this.studyCardQueue()?.activeCards() ?? []);

    /** Current card shown on the learning page. */
    readonly curStudyCard = computed(() => this.studyCardQueue()?.curCard() ?? null);

    /** Aggregated study queue counters shown above the answer action. */
    readonly queueCounts = this.learnSession.queueCounts;

    /** Rendered card document for the current side. */
    readonly cardDocument = computed(() => {
        const studyCard = this.curStudyCard();
        if (!studyCard) {
            return "";
        }

        const template = this.answerVisible()
            ? studyCard.noteTpl.back
            : studyCard.noteTpl.front;
        return renderCardDocument({
            css: studyCard.noteTpl.css,
            template,
            fields: this.createRenderFields(studyCard),
        });
    });

    /** Load the initial study queue for the current deck. */
    ngOnInit(): void {
        void this.learnSession.clearSchedulerCache().then(() => {
            void this.loadStudyCards();
        });
    }
    
    /** Load cards that are due for the current deck. */
    private async loadStudyCards(): Promise<void> {
        const deck = this.learnSession.deck();
        if (!deck) {
            this.notify.open(this.translate.instant("PAGES.LEARN.SHELL.LOAD_FAILED"));
            Logger.error("Tried to load study cards without a deck in state");
            return;
        }

        const queue = new StudyCardQueue(deck.id);
        this.studyCardQueue.set(queue);
        await queue.loadInitial();
        this.startCardTimer();
    }

    /** Clear the cached FSRS scheduler when the learning page is destroyed. */
    ngOnDestroy(): void {
        void this.learnSession.clearSchedulerCache();
    }

    /** Reveal the current card answer side and load its rating previews. */
    async showAnswer(): Promise<void> {
        this.stopCardTimer();
        this.answerVisible.set(true);
        await this.loadRatingPreviews();
    }
    
    /** Load FSRS rating previews for the current study card. */
    private async loadRatingPreviews(): Promise<void> {
        const studyCard = this.curStudyCard();
        if (!studyCard) {
            this.ratingPreviews.set(null);
            return;
        }

        const previews = await this.learnSession.getRatingPreviews(studyCard);
        this.ratingPreviews.set(previews);
    }

    /** Format the previewed next interval for one rating button. */
    ratingInterval(rating: CardRating): string {
        const preview = this.ratingPreviews()?.[rating];
        if (!preview) {
            return "";
        }

        return this.formatInterval(preview.intervalMs);
    }

    /**
     * rate the current card and advance
     * @param rating - CardRating
     */
    async rateCurCard(rating: CardRating): Promise<void> {
        const studyCard = this.curStudyCard();
        if (!studyCard) {
            Logger.error("Tried to rate a card when no current card was set");
            return;
        }

        const result = await this.learnSession.reviewCard(studyCard, rating, this.currentCardDurationMs);
        if (result.state === "success") {
            const queue = this.studyCardQueue()!;
            await queue.advance();
            if (queue.noMoreCards()) {
                this.ratingPreviews.set(null);
                this.answerVisible.set(false);
                await this.navigateToCompleted();
                return;
            }
            this.startCardTimer();
        }
        this.ratingPreviews.set(null);
        this.answerVisible.set(false);
    }

    /** Start measuring front-side viewing duration for the current card. */
    private startCardTimer(): void {
        if (!this.curStudyCard()) {
            this.cardTimerStartedAt = null;
            this.currentCardDurationMs = 0;
            return;
        }

        this.cardTimerStartedAt = Date.now();
        this.currentCardDurationMs = 0;
    }

    /** Stop measuring front-side viewing duration and cap it at the allowed maximum. */
    private stopCardTimer(): void {
        if (this.cardTimerStartedAt === null) {
            return;
        }

        const maxReviewDurationMs = 60_000;
        this.currentCardDurationMs = Math.min(
            Date.now() - this.cardTimerStartedAt,
            maxReviewDurationMs,
        );
        this.cardTimerStartedAt = null;
    }

    /** Navigate to the completed page after the queue confirms no cards remain. */
    private async navigateToCompleted(): Promise<void> {
        await this.router.navigate(["..", LEARN_PATHS.completed], {
            relativeTo: this.route,
        });
    }

    /** Convert note-template field ids to renderable field names and values. */
    private createRenderFields(studyCard: StudyCard): CardRenderField[] {
        return studyCard.noteTpl.fields.map((tplField) => {
            const value = studyCard.note.fields.find((field) => field.id === String(tplField.id))?.value ?? "";
            return {
                name: tplField.name,
                value,
            };
        });
    }

    /** Convert a millisecond interval to a compact learning button label. */
    private formatInterval(intervalMs: number): string {
        const minuteMs = 60_000;
        const hourMs = 60 * minuteMs;
        const dayMs = 24 * hourMs;

        if (intervalMs < hourMs) {
            return this.translate.instant("PAGES.LEARN.CARD.INTERVAL.MINUTE", {
                count: Math.max(1, Math.round(intervalMs / minuteMs)),
            });
        }
        if (intervalMs < dayMs) {
            return this.translate.instant("PAGES.LEARN.CARD.INTERVAL.HOUR", {
                count: Math.max(1, Math.round(intervalMs / hourMs)),
            });
        }
        return this.translate.instant("PAGES.LEARN.CARD.INTERVAL.DAY", {
            count: Math.max(1, Math.round(intervalMs / dayMs)),
        });
    }
}
