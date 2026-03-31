import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AfterViewInit, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { DictionaryWindowService } from './dictionary-window.service';
import { DictionarySelectionService } from './selection/selection.service';
import { MeaningCardComponent } from './sub-components/meaning-card.component';
import Logger from 'electron-log/renderer';
import { TranslatePipe } from '@ngx-translate/core';
import { Definition, DictionaryEntry } from '@main/db/services/dic-service-types';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, from, map, switchMap } from 'rxjs';

@Component({
    selector: 'app-dictionary',
    imports: [
        MatCardModule,
        MatIconModule,
        MatDividerModule,
        MatButtonModule,
        MeaningCardComponent,
        TranslatePipe,
    ],
    templateUrl: './dictionary.component.html',
    styleUrl: './dictionary.component.scss',
})
export class DictionaryComponent implements AfterViewInit {
    private readonly selectionService = inject(DictionarySelectionService);
    private readonly dictionaryWindowService = inject(DictionaryWindowService);
    readonly dictionaryWindow =
        viewChild<ElementRef<HTMLElement>>('dictionaryWindow');

    // Floating window top-left position in viewport coordinates.
    readonly windowPosition = signal({ left: 24, top: 24 });
    // Floating window size in pixels.
    readonly windowSize = signal({ width: 960, height: 640 });

    // Viewport and sizing constraints.
    private readonly minWindowWidth = 620;
    private readonly minWindowHeight = 420;

    // Interaction state.
    private isDragging = false;
    private isResizing = false;
    // Drag start snapshot.
    private dragStartPointerX = 0;
    private dragStartPointerY = 0;
    private dragStartLeft = 0;
    private dragStartTop = 0;
    // Resize start snapshot.
    private resizeStartPointerX = 0;
    private resizeStartPointerY = 0;
    private resizeStartWidth = 0;
    private resizeStartHeight = 0;
    private resizeStartLeft = 0;
    private resizeStartTop = 0;

    readonly selectedText = computed(
        () => this.selectionService.selection().selectedText,
    );
    readonly contextSentence = computed(
        () => this.selectionService.selection().contextSentence,
    );
    readonly hasSelectedText = computed(() =>
        Boolean(this.selectedText()?.trim()),
    );
    readonly meaningEmptyMessageKey = computed(() =>
        this.hasSelectedText()
            ? 'DICTIONARY.NO_RESULTS'
            : 'DICTIONARY.NO_SELECTION',
    );
    readonly visible = computed(() => this.dictionaryWindowService.visible());

    hideWindow(): void {
        this.dictionaryWindowService.hide();
    }

    ngAfterViewInit(): void {
        // Read initial rendered rect and sync it into reactive state.
        const windowRef = this.dictionaryWindow();
        if (!windowRef) {
            return;
        }
        const rect = windowRef.nativeElement.getBoundingClientRect();
        this.windowPosition.set({
            left: rect.left,
            top: rect.top,
        });
        this.windowSize.set({
            width: rect.width,
            height: rect.height,
        });
        this.normalizeWindowBounds();
    }

    onWindowDragStart(event: PointerEvent): void {
        // Do not start drag if currently resizing.
        if (this.isResizing) {
            return;
        }

        // Only left mouse button starts drag.
        if (event.button !== 0) {
            return;
        }

        // Do not start drag when clicking toolbar buttons (e.g. close).
        const target = event.target as HTMLElement | null;
        if (target?.closest('button')) {
            return;
        }

        // prevent original drag behavior (e.g. text selection) and start dragging.
        event.preventDefault();
        this.isDragging = true;
        this.dragStartPointerX = event.clientX;
        this.dragStartPointerY = event.clientY;
        this.dragStartLeft = this.windowPosition().left;
        this.dragStartTop = this.windowPosition().top;
    }

    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent): void {
        if (this.handleResizeMove(event)) {
            return;
        }
        this.handleDragMove(event);
    }

    private handleResizeMove(event: PointerEvent): boolean {
        if (!this.isResizing) {
            return false;
        }
        const deltaX = event.clientX - this.resizeStartPointerX;
        const deltaY = event.clientY - this.resizeStartPointerY;
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;

        // Max size is anchored by the start top-left corner.
        const maxWidth = Math.max(
            this.minWindowWidth,
            viewportWidth - this.resizeStartLeft,
        );
        const maxHeight = Math.max(
            this.minWindowHeight,
            viewportHeight - this.resizeStartTop,
        );
        const nextSize = {
            width: Math.min(
                Math.max(this.resizeStartWidth + deltaX, this.minWindowWidth),
                maxWidth,
            ),
            height: Math.min(
                Math.max(this.resizeStartHeight + deltaY, this.minWindowHeight),
                maxHeight,
            ),
        };
        this.windowSize.set(nextSize);
        return true;
    }

    private handleDragMove(event: PointerEvent): void {
        if (!this.isDragging) {
            return;
        }

        // Drag by pointer delta and clamp into viewport bounds.
        const deltaX = event.clientX - this.dragStartPointerX;
        const deltaY = event.clientY - this.dragStartPointerY;
        const nextPosition = this.clampPositionToViewport({
            left: this.dragStartLeft + deltaX,
            top: this.dragStartTop + deltaY,
        });
        this.windowPosition.set(nextPosition);
    }

    onResizeStart(event: PointerEvent): void {
        // ignore non-left-clicks.
        if (event.button !== 0) {
            return;
        }

        // Ensure state is valid before taking resize baseline.
        this.normalizeWindowBounds();
        event.preventDefault();
        event.stopPropagation();
        this.isResizing = true;
        this.resizeStartPointerX = event.clientX;
        this.resizeStartPointerY = event.clientY;
        this.resizeStartWidth = this.windowSize().width;
        this.resizeStartHeight = this.windowSize().height;
        this.resizeStartLeft = this.windowPosition().left;
        this.resizeStartTop = this.windowPosition().top;
    }

    @HostListener('document:pointerup')
    onPointerUp(): void {
        this.isDragging = false;
        this.isResizing = false;
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        // Keep window valid after viewport size changes.
        this.normalizeWindowBounds();
    }

    private normalizeWindowBounds(): void {
        if (!this.dictionaryWindow()) {
            return;
        }
        // Normalize size first, then position using normalized size.
        this.windowSize.set(this.clampSizeToViewport(this.windowSize()));
        this.windowPosition.set(
            this.clampPositionToViewport(this.windowPosition()),
        );
    }

    private clampPositionToViewport(position: { left: number; top: number }): {
        left: number;
        top: number;
    } {
        // Clamp top-left so the whole window remains inside viewport.
        const size = this.windowSize();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const maxLeft = Math.max(0, viewportWidth - size.width);
        const maxTop = Math.max(0, viewportHeight - size.height);
        return {
            left: Math.min(Math.max(position.left, 0), maxLeft),
            top: Math.min(Math.max(position.top, 0), maxTop),
        };
    }

    private clampSizeToViewport(size: { width: number; height: number }): {
        width: number;
        height: number;
    } {
        // Clamp size by min constraints and available space from current top-left.
        const position = this.windowPosition();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const maxWidth = Math.max(
            this.minWindowWidth,
            viewportWidth - position.left,
        );
        const maxHeight = Math.max(
            this.minWindowHeight,
            viewportHeight - position.top,
        );

        return {
            width: Math.min(
                Math.max(size.width, this.minWindowWidth),
                maxWidth,
            ),
            height: Math.min(
                Math.max(size.height, this.minWindowHeight),
                maxHeight,
            ),
        };
    }

    addCard(definition: Definition, partOfSpeech: string): void {
        // TODO: implement add card logic
        Logger.info('add card', { partOfSpeech, definition });
    }

    readonly dummyEntry: DictionaryEntry = {
        word: '',
        phoneticSymbol: { bre: '-', ame: '-' },
        senses: [],
    };

    readonly entry = toSignal(
        toObservable(this.selectedText).pipe(
            debounceTime(50),
            distinctUntilChanged(),
            switchMap((word) =>
                from(window.service.dicService.queryWord(word)),
            ),
            map((result) => {
                if (!result) {
                    return this.dummyEntry;
                } else {
                    return result;
                }
            }),
        ),
        {
            initialValue: this.dummyEntry
        }
    );
}



