import { Component, Input } from '@angular/core';
import { TwoVehicleCostComparison } from '../models/two-vehicle-cost-comparison';
import { CommonModule } from '@angular/common';
import { CostComparisonComponent } from '../cost-comparison/cost-comparison.component';
import { DollarsCostComparisonComponent } from '../dollars-cost-comparison/dollars-cost-comparison.component';
import { SelectedVehicleDetails } from '../models/selected-vehicle-details';

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

  vehicleOneMakeModel(): string {
    return this.vehicleMakeModel(this.comparison?.vehicleOne);
  }

  vehicleTwoMakeModel(): string {
    return this.vehicleMakeModel(this.comparison?.vehicleTwo);
  }

  vehicleMakeModel(vehicle: SelectedVehicleDetails | undefined): string {
    if (!vehicle) {
      return ""
    }
    return `${vehicle.vehicleSelection.year} ${vehicle.vehicleSelection.make} ${vehicle.vehicleSelection.model}`;
  }
}
