import { Component, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-file-input",
    imports: [MatButtonModule, MatIconModule],
    templateUrl: "./file-input.component.html",
    styleUrl: "./file-input.component.scss",
})
export class FileInputComponent {
    label = input<string>();
    filePath = input<string>();
}
