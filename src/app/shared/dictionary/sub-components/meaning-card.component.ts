import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-meaning-card',
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './meaning-card.component.html',
  styleUrl: './meaning-card.component.scss',
})
export class MeaningCardComponent {
  senseLabel = input('');
  badge = input('');
  meaningLines = input<string[]>([]);
  meaningZh = input('');
  examples = input<{ text: string; zh?: string }[]>([]);
}
