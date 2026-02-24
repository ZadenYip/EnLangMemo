import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { DictionarySelectionService } from './selection.service';

/**
 * It should be attached to any element that contains text 
 * which you expect users to select for dictionary lookup. 
 */
@Directive({
    selector: '[appDictionarySelectionSource]',
    standalone: true,
})
export class DictionarySelectionSourceDirective {

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly selectionService = inject(DictionarySelectionService);

    @HostListener('mouseup')
    onMouseUp(): void {
        this.captureSelection();
    }

    private captureSelection(): void {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const selectedText = this.cleanWhitespace(selection.toString());
        if (!selectedText) {
            return;
        }

        const range = selection.getRangeAt(0);
        const isInOneNode = this.isSelectionInOneNode(range);
        if (!isInOneNode) {
            return;
        }

        // review next
        const contextSentence = this.extractContextSentence(range);
        this.selectionService.updateSelection(
            selectedText,
            contextSentence || selectedText,
        );
    }

    private isSelectionInOneNode(range: Range): boolean {
        const hostElement = this.host.nativeElement;
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        if (!hostElement.contains(startContainer) || !hostElement.contains(endContainer)) {
            return false;
        }

        return startContainer === endContainer;
    }

    private extractContextSentence(range: Range): string {
        const contextNode = range.startContainer;
        const contextRaw = contextNode.textContent ?? '';
        if (!contextRaw) {
            return '';
        }

        const selectedStart = this.getOffsetFromNodeStart(
            contextNode,
            range.startContainer,
            range.startOffset,
        );
        const selectedEnd = this.getOffsetFromNodeStart(
            contextNode,
            range.endContainer,
            range.endOffset,
        );
        const sentenceStart = this.findSentenceStart(contextRaw, selectedStart);
        const sentenceEnd = this.findSentenceEnd(contextRaw, selectedEnd);
        return this.cleanWhitespace(contextRaw.slice(sentenceStart, sentenceEnd));
    }

    private getOffsetFromNodeStart(
        rootNode: Node,
        container: Node,
        offset: number,
    ): number {
        const prefixRange = document.createRange();
        prefixRange.selectNodeContents(rootNode);
        prefixRange.setEnd(container, offset);
        return prefixRange.toString().length;
    }

    private findSentenceStart(text: string, fromIndex: number): number {
        for (let i = fromIndex - 1; i >= 0; i -= 1) {
            if (this.isSentenceBoundary(text[i])) {
                return i + 1;
            }
        }
        return 0;
    }

    private findSentenceEnd(text: string, fromIndex: number): number {
        for (let i = fromIndex; i < text.length; i += 1) {
            if (this.isSentenceBoundary(text[i])) {
                return i + 1;
            }
        }
        return text.length;
    }

    private isSentenceBoundary(char: string): boolean {
        return char === '.' || char === '!' || char === '?' || char === '\n';
    }

    private cleanWhitespace(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }
}
