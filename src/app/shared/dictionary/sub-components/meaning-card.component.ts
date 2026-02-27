import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { Definition } from '../dictionary-interface';

@Component({
    selector: 'app-meaning-card',
    imports: [CommonModule, MatButtonModule, MatCardModule, MatExpansionModule],
    templateUrl: './meaning-card.component.html',
    styleUrl: './meaning-card.component.scss',
})
export class MeaningCardComponent {
    index = input(0);
    posLabel = input('');
    item = input<Definition>({
        cefr: '',
        definition: { source: '', target: '' },
        examples: [],
    });
    add = output<Definition>();

    addToCard(): void {
        this.add.emit(this.item());
    }
}
