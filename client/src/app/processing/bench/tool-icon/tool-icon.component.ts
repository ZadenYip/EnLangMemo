import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
    selector: "app-tool-icon",
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: "./tool-icon.component.html",
    styleUrl: "./tool-icon.component.scss",
    standalone: true,
})
export class ToolIconComponent {
    /**
     * Material icon name to render in the button.
     */
    iconName = input("");

    /**
     * Tooltip text shown on hover.
     */
    tooltip = input("");

    /**
     * Delay (ms) before the tooltip is shown.
     */
    tooltipDelay = input(500);

    /**
     * Emits when the button is clicked.
     */
    clicked = output<void>();

    /**
     * Emits the click event for parent handlers.
     */
    emitClick(): void {
        this.clicked.emit();
    }
}
