import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { TranslateModule } from "@ngx-translate/core";
import { FileInputComponent } from "../file-input/file-input.component";

@Component({
    selector: "app-dic-import",
    imports: [
        TranslateModule,
        MatCardModule,
        FileInputComponent
    ],
    templateUrl: "./dic-import.component.html",
    styleUrl: "./dic-import.component.scss",
})
export class DicImportComponent {
    protected onSelectFile(slot: string, file: File): void {
        // Placeholder for later import-module integration.
        void slot;
        void file;
    }
}
