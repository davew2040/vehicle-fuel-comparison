import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { numberValidator } from '../validators/number-validator';
import { FuelType } from '../enums/fuel-type';
import { TrailingDecimalsPipe } from '../pipes/trailingDecimals.pipe';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { VehicleFuelApiResponse } from '../models/vehicle-fuel-api-response';
import { FuelTypeApiValue } from '../enums/fuel-type-api-values';

@Component({
  selector: 'app-single-vehicle-stats',
  imports: [TrailingDecimalsPipe, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './single-vehicle-stats.component.html',
  styleUrl: './single-vehicle-stats.component.scss'
})
export class SingleVehicleStatsComponent {
  valuesForm: FormGroup;
  fuelTypeOptions = Object.values(FuelType); // for iteration
  destroy$: Subject<void>;

  @Output()
  selectedVehicleStats = new EventEmitter<SingleVehicleStatsData>();

  constructor(private fb: FormBuilder) {
    this.destroy$ = new Subject<void>();

    this.valuesForm = this.fb.group({
      cityMpg: ['25', [Validators.required, numberValidator()]],
      highwayMpg: ['30', [Validators.required, numberValidator()]],
      cityMpkwh: ['3.5', [Validators.required, numberValidator()]],
      highwayMpKwh: ['3.0', [Validators.required, numberValidator()]],
      selectedFuelType: [FuelType.Gasoline]
    });
  }

  public setVehicleStats(vehicle: VehicleFuelApiResponse) {
    console.log('setVehicleStats', vehicle)

    this.formControls['cityMpkwh'].setValue(this.limitDecimals(vehicle.city08U, 2))
    this.formControls['highwayMpKwh'].setValue(this.limitDecimals(vehicle.highway08U, 2))

    if (vehicle.fuelType === FuelTypeApiValue.Electricity) {
      this.formControls['cityMpkwh'].setValue(this.limitDecimals(100.0 / vehicle.cityE, 2))
      this.formControls['highwayMpKwh'].setValue(this.limitDecimals(100.0 / vehicle.highwayE, 2))

      this.formControls['cityMpg'].setValue(this.limitDecimals(vehicle.city08U, 2))
      this.formControls['highwayMpg'].setValue(this.limitDecimals(vehicle.highway08U, 2))

      this.formControls['selectedFuelType'].setValue(FuelType.Electric)
    }
    else {
      this.formControls['cityMpg'].setValue(this.limitDecimals(vehicle.city08U, 2))
      this.formControls['highwayMpg'].setValue(this.limitDecimals(vehicle.highway08U, 2))

      this.formControls['cityMpkwh'].setValue(this.limitDecimals(vehicle.city08U / 33.705, 2))
      this.formControls['highwayMpKwh'].setValue(this.limitDecimals(vehicle.highway08U/ 33.705, 2))

      this.formControls['selectedFuelType'].setValue(FuelType.Gasoline)
    }

    this.selectedVehicleStats.emit(this.currentStats)
  }

  get formControls() {
    return this.valuesForm.controls;
  }

  limitDecimals(value: any, decimals: number): number {
    if (typeof value === 'number')
    {
      const fixed = parseFloat(value.toFixed(decimals))
      return fixed;
    }

    return value;
  }

  isGasolineSelected(): boolean {
    return this.valuesForm.get('selectedFuelType')!.value === FuelType.Gasoline
  }

  isElectricSelected(): boolean {
    return this.valuesForm.get('selectedFuelType')!.value === FuelType.Electric
  }


  get currentStats(): SingleVehicleStatsData {
    if (this.formControls['selectedFuelType'].value == FuelType.Gasoline) {
      return {
        cityMilesPerUnit: this.formControls['cityMpg'].value,
        highwayMilesPerUnit: this.formControls['highwayMpg'].value,
        fuelType: FuelType.Gasoline
      }
    }
    else {
      return {
        cityMilesPerUnit: this.formControls['cityMpkwh'].value,
        highwayMilesPerUnit: this.formControls['highwayMpKwh'].value,
        fuelType: FuelType.Electric
      }
    }
  }
}

export interface SingleVehicleStatsData {
  cityMilesPerUnit: number,
  highwayMilesPerUnit: number,
  fuelType: FuelType
}
