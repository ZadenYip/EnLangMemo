import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MeaningCardComponent } from './sub-components/meaning-card.component';


@Component({
  selector: 'app-dictionary',
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    ScrollingModule,
    MeaningCardComponent,
],
  templateUrl: './dictionary.component.html',
  styleUrl: './dictionary.component.scss',
})
export class DictionaryComponent {
  readonly meaningCards = [
    {
      senseLabel: 'A1',
      badge: '01',
      meaningLines: ['PLACEHOLDER_MEANING_ONE_LINE_1', 'PLACEHOLDER_MEANING_ONE_LINE_2'],
      meaningZh: 'PLACEHOLDER_MEANING_ONE_ZH',
      examples: [
        { text: 'PLACEHOLDER_EXAMPLE_ONE', zh: 'PLACEHOLDER_EXAMPLE_ONE_ZH' },
        { text: 'PLACEHOLDER_EXAMPLE_ONE_B', zh: 'PLACEHOLDER_EXAMPLE_ONE_B_ZH' },
      ],
    },
    {
      senseLabel: 'B1',
      badge: '02',
      meaningLines: ['PLACEHOLDER_MEANING_TWO_LINE_1', 'PLACEHOLDER_MEANING_TWO_LINE_2'],
      meaningZh: 'PLACEHOLDER_MEANING_TWO_ZH',
      examples: [{ text: 'PLACEHOLDER_EXAMPLE_TWO', zh: 'PLACEHOLDER_EXAMPLE_TWO_ZH' }],
    },
    {
      senseLabel: 'C1',
      badge: '03',
      meaningLines: ['PLACEHOLDER_MEANING_THREE_LINE_1', 'PLACEHOLDER_MEANING_THREE_LINE_2'],
      meaningZh: 'PLACEHOLDER_MEANING_THREE_ZH',
      examples: [{ text: 'PLACEHOLDER_EXAMPLE_THREE', zh: 'PLACEHOLDER_EXAMPLE_THREE_ZH' }],
    },
  ];
}
