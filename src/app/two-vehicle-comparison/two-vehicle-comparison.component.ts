import { Component, Input } from '@angular/core';
import { TwoVehicleCostComparison } from '../models/two-vehicle-cost-comparison';
import { CommonModule } from '@angular/common';
import { CostComparisonComponent } from '../cost-comparison/cost-comparison.component';
import { DollarsCostComparisonComponent } from '../dollars-cost-comparison/dollars-cost-comparison.component';

@Component({
  selector: 'app-two-vehicle-comparison',
  imports: [CommonModule,
    CostComparisonComponent,
    DollarsCostComparisonComponent
  ],
  templateUrl: './two-vehicle-comparison.component.html',
  styleUrl: './two-vehicle-comparison.component.scss'
})
export class TwoVehicleComparisonComponent {
  @Input()
  comparison: TwoVehicleCostComparison | null = null;
}
