import { Component, inject, signal, viewChild } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core";
import { NoteTemplateEditorTextareaComponent } from "./editor-textarea/editor-textarea.component";
import { CardTplOpsComponent } from "./card-tpl-ops/card-tpl-ops.component";
import { NoteTplOpsComponent } from "./note-tpl-ops/note-tpl-ops.component";
import { NoteTplService } from "./note-tpl.service";
import {
    SelectDropdownOption,
} from "@render/shared/components/select-dropdown/select-dropdown.component";

type NoteTplSection = "front" | "back" | "css";

@Component({
    selector: "app-bench-template-edit",
    standalone: true,
    providers: [NoteTplService],
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
    private readonly noteTplService = inject(NoteTplService);
    private readonly cardTplOps = viewChild.required(CardTplOpsComponent);

    /**
     * Currently selected editor section.
     */
    section = signal<NoteTplSection>("front");

    /**
     * Front template editor content.
     */
    frontTpl = signal("");

    /**
     * Back template editor content.
     */
    backTpl = signal("");

    /**
     * Note-template css editor content.
     */
    cssTpl = signal("");

    /**
     * Handle card template selection change to sync editor content.
     * @param cardTplOption - The selected card template option to sync editors with.
     */
    onCardTplSelected(cardTplOption: SelectDropdownOption): void {
        this.syncEditors(cardTplOption);
    }

    /**
     * Sync front/back editor areas from selected card-template cache.
     */
    private syncEditors(option: SelectDropdownOption): void {
        const curCardTpl = this.noteTplService.getCardTplById(option.value);
        this.frontTpl.set(curCardTpl!.front);
        this.backTpl.set(curCardTpl!.back);
    }

    /**
     * Handle note template selection change to sync state.
     * @param _noteTplOption - The selected note template option to sync state with.
     */
    onNoteTplSelected(_noteTplOption: SelectDropdownOption): void {
        this.syncStateCurNoteTpl();
    }

    /**
     * Sync view state from current cached note template in service.
     */
    private syncStateCurNoteTpl(): void {
        const curNoteTpl = this.noteTplService.getNoteTpl();
        const nextCardTplOpts = this.noteTplService.getCardTplOptions();
        this.cssTpl.set(curNoteTpl!.css);
        this.cardTplOps().syncFromService(nextCardTplOpts);
    }


    /**
     * Handle section switch for textarea display.
     */
    onSectionChange(section: NoteTplSection): void {
        this.section.set(section);
    }

    onEditorValueChange(_nextValue: string): void {
        // TODO 给一个保存按钮才对而不是试试存在变化就更新缓存
    }

}
