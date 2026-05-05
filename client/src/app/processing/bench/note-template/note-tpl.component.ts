import { Component, inject } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { NoteTemplateEditorTextareaComponent } from "./editor-textarea/editor-textarea.component";
import { NoteTplProvider } from "./note-tpl.provider";
import { CardTplOpsComponent } from "./card-tpl-ops/card-tpl-ops.component";
import { NoteTplOpsComponent } from "./note-tpl-ops/note-tpl-ops.component";

@Component({
    selector: "app-bench-note-template",
    standalone: true,
    providers: [NoteTplProvider],
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
export class BenchNoteTemplateComponent {
    /**
     * Provider that owns note-template UI state.
     */
    private readonly provider = inject(NoteTplProvider);

    /**
     * Dropdown options for card templates.
     */
    readonly cardTplOpts = this.provider.cardTplOpts;

    /**
     * Dropdown options for note templates.
     */
    readonly noteTplOpts = this.provider.noteTplOpts;

    /**
     * Currently selected card template option.
     */
    readonly selCardTpl = this.provider.selCardTpl;

    /**
     * Currently selected note template option.
     */
    readonly selNoteTpl = this.provider.selNoteTpl;

    /**
     * Selected note template section.
     */
    readonly section = this.provider.section;

    /**
     * Front template HTML content.
     */
    readonly frontTpl = this.provider.frontTpl;

    /**
     * Back template HTML content.
     */
    readonly backTpl = this.provider.backTpl;

    /**
     * CSS template content.
     */
    readonly cssTpl = this.provider.cssTpl;

    /**
     * Update the current card template selection.
     */
    pickCardTpl(option: Parameters<NoteTplProvider["pickCardTpl"]>[0]): void {
        this.provider.pickCardTpl(option);
    }

    /**
     * UI placeholder for creating a card template.
     */
    addCardTpl(): void {
        this.provider.addCardTpl();
    }

    /**
     * Update the current note template selection.
     */
    pickNoteTpl(option: Parameters<NoteTplProvider["pickNoteTpl"]>[0]): void {
        this.provider.pickNoteTpl(option);
    }

    /**
     * Switch the active template section.
     */
    setSection(section: Parameters<NoteTplProvider["setSection"]>[0]): void {
        this.provider.setSection(section);
    }

    /**
     * UI placeholder for creating a note template.
     */
    addNoteTpl(): void {
        this.provider.addNoteTpl();
    }

    /**
     * UI placeholder for note-template settings.
     */
    openNoteTplSettings(): void {
        this.provider.openNoteTplSettings();
    }
}
