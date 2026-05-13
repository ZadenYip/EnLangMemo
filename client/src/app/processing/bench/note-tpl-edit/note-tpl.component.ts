import { Component, inject, signal } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NoteTemplateEditorTextareaComponent } from "./editor-textarea/editor-textarea.component";
import { NotifyService } from "@render/shared/services/notify.service";
import { BenchStateService } from "../bench-state.service";

type NoteTplSection = "front" | "back" | "css";

@Component({
    selector: "app-bench-template-edit",
    standalone: true,
    imports: [
        MatRadioModule,
        MatButtonModule,
        NoteTemplateEditorTextareaComponent,
        TranslateModule,

    ],
    templateUrl: "./note-tpl.component.html",
    styleUrl: "./note-tpl.component.scss",
})
export class BenchTemplateEditComponent {
    readonly benchState = inject(BenchStateService);
    private readonly notify = inject(NotifyService);
    private readonly translate = inject(TranslateService);

    /**
     * Currently selected editor section.
     * Editor textarea will switch content based on this value.
     */
    section = signal<NoteTplSection>("front");

    /**
     * Handle section switch for textarea display.
     */
    onSectionChange(section: NoteTplSection): void {
        this.section.set(section);
    }

    onEditorValueChange(value: string): void {
        this.benchState.updateDraft(this.section(), value);
    }

    /**
     * Persist current edited template content.
     */
    async onSaveTemplate(): Promise<void> {
        const result = await this.benchState.saveTemplateDraft();
        switch (result.state) {
            case "success":
                this.notify.open(this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.SAVE_TEMPLATE.SUCCESS"));
                return;
            case "not-found":
                this.notify.open(this.translate.instant("PAGES.PROCESSING.BENCH.TEMPLATE_EDIT.SAVE_TEMPLATE.NOT_FOUND"));
                return;
        }
    }

}
