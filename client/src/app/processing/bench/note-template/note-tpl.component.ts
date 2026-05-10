import { Component, inject } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { NoteTemplateEditorTextareaComponent } from "./editor-textarea/editor-textarea.component";
import { CardTplSection, NoteTplVm } from "./note-tpl.vm";
import { CardTplOpsComponent } from "./card-tpl-ops/card-tpl-ops.component";
import { NoteTplOpsComponent } from "./note-tpl-ops/note-tpl-ops.component";

@Component({
    selector: "app-bench-template-edit",
    standalone: true,
    providers: [NoteTplVm],
    imports: [
        MatRadioModule,
        NoteTemplateEditorTextareaComponent,
        CardTplOpsComponent,
        NoteTplOpsComponent,
        TranslateModule,
    ],
    templateUrl: "./note-tpl.component.html",
    styleUrl: "./note-tpl.component.scss",
})
export class BenchTemplateEditComponent {
    /**
     * View-model provider that owns note-template UI state and actions.
     */
    readonly vm = inject(NoteTplVm);

    /**
     * Update section only when value is a supported template section.
     */
    onSectionChange(value: CardTplSection): void {
        if (value === "front" || value === "back" || value === "css") {
            this.vm.setSection(value);
        }
    }
}
