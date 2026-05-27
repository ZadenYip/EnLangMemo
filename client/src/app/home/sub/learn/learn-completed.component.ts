import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { APP_PATHS } from "../../../root-route";
import { LearnStateService } from "./learn-state.service";

@Component({
    selector: "app-learn-completed",
    standalone: true,
    imports: [
        MatButtonModule,
        TranslateModule,
    ],
    templateUrl: "./learn-completed.component.html",
    styleUrl: "./learn-completed.component.scss",
})
export class LearnCompletedComponent {
    /** Router used to return to the main deck page. */
    private readonly router = inject(Router);

    /** Shared learning route state loaded by the parent route. */
    private readonly learnState = inject(LearnStateService);

    /** Deck overview used in the completion message. */
    readonly deck = this.learnState.deck;

    /** Return to the main deck page. */
    backToHome(): void {
        void this.router.navigate([APP_PATHS.deck]);
    }
}
