import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { Definition } from '../dictionary-interface';

@Component({
  selector: 'app-meaning-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule
  ],
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
}
