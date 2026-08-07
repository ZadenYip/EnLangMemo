import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { Definition } from "@main/db/services/dictionary/dic-service-types";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: "app-meaning-card",
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatExpansionModule,
        TranslatePipe,
    ],
    templateUrl: "./meaning-card.component.html",
    styleUrl: "./meaning-card.component.scss",
})
export class MeaningCardComponent {
    index = input(0);
    posLabel = input("");
    item = input<Definition>({
        defId: -1,
        definition: { src: "", target: "" },
        examples: [],
    });
    /**
     * Emits the selected definition to add into the processing pool.
     */
    addToProcessingPool = output<Definition>();

    /**
     * Emit current definition when user adds it to processing pool.
     */
    addCurrentToProcessingPool(): void {
        this.addToProcessingPool.emit(this.item());
    }
}
