import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dollars-cost-comparison',
  imports: [CommonModule],
  templateUrl: './dollars-cost-comparison.component.html',
  styleUrl: './dollars-cost-comparison.component.scss'
})
export class DollarsCostComparisonComponent {
  @Input()
  comparisonLabel: string = ""

  @Input()
  costOne: number = 0.0

  @Input()
  costTwo: number = 0.0

  @Input()
  item1Label: string = ""

  @Input()
  item2Label: string = ""

  abs(value: number): number{
    return Math.abs(value)
  }
}
