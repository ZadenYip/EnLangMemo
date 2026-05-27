import { Component, computed, inject, input } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
    selector: "app-card-frame",
    standalone: true,
    templateUrl: "./card-frame.component.html",
    styleUrl: "./card-frame.component.scss",
})
export class CardFrameComponent {
    private readonly sanitizer = inject(DomSanitizer);

    /**
     * Complete HTML document rendered inside the isolated card iframe.
     */
    readonly document = input("");

    /**
     * Placeholder text shown when there is no card document to render.
     */
    readonly emptyText = input("");

    /**
     * Trusted iframe srcdoc so Angular keeps style tags in the card document.
     */
    readonly trustedDocument = computed<SafeHtml | "">(() => {
        const document = this.document();
        if (!document) {
            return "";
        }
        return this.sanitizer.bypassSecurityTrustHtml(document);
    });
}
