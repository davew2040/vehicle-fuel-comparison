import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cost-comparison',
  imports: [CommonModule],
  templateUrl: './cost-comparison.component.html',
  styleUrl: './cost-comparison.component.scss',
  standalone: true
})
export class CostComparisonComponent {
  @Input()
  difference: number = 0.0

  @Input()
  comparisonLabel: string = ""

  @Input()
  item1Label: string = ""

  @Input()
  item2Label: string = ""
}
