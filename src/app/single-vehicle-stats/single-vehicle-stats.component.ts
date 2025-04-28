import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { numberValidator } from '../validators/number-validator';
import { FuelType } from '../enums/fuel-type';
import { TrailingDecimalsPipe } from '../pipes/trailingDecimals.pipe';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { VehicleFuelApiResponse } from '../models/vehicle-fuel-api-response';
import { FuelTypeApiValue } from '../enums/fuel-type-api-values';
import { SelectedVehicleDetails } from '../models/selected-vehicle-details';

@Component({
  selector: 'app-single-vehicle-stats',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './single-vehicle-stats.component.html',
  styleUrl: './single-vehicle-stats.component.scss'
})
export class SingleVehicleStatsComponent {
  valuesForm: FormGroup;
  fuelTypeOptions = Object.values(FuelType); // for iteration
  destroy$: Subject<void>;

  @Output()
  selectedVehicleStats = new EventEmitter<SingleVehicleStatsData>();

  @Input()
  btnPrefix: string = ""

  constructor(private fb: FormBuilder) {
    this.destroy$ = new Subject<void>();

    this.valuesForm = new FormGroup<StatsForm>({
      cityMpg: ['25', [Validators.required, numberValidator()]],
      highwayMpg: ['30', [Validators.required, numberValidator()]],
      cityMpkwh: ['3.5', [Validators.required, numberValidator()]],
      highwayMpKwh: ['3.0', [Validators.required, numberValidator()]],
      selectedFuelType: [FuelType.Gasoline]
    });

    this.valuesForm = this.fb.group({
      cityMpg: ['25', [Validators.required, numberValidator()]],
      highwayMpg: ['30', [Validators.required, numberValidator()]],
      cityMpkwh: ['3.5', [Validators.required, numberValidator()]],
      highwayMpKwh: ['3.0', [Validators.required, numberValidator()]],
      selectedFuelType: [FuelType.Gasoline]
    });
  }

  public setVehicleStats(vehicle: SelectedVehicleDetails) {
    const vehicleEfficiency = vehicle.efficiencyInfo

    console.log('setVehicleStats', vehicleEfficiency)

    this.formControls['cityMpkwh'].setValue(this.limitDecimals(vehicleEfficiency.city08U, 2))
    this.formControls['highwayMpKwh'].setValue(this.limitDecimals(vehicleEfficiency.highway08U, 2))

    if (vehicleEfficiency.fuelType === FuelTypeApiValue.Electricity) {
      this.formControls['cityMpkwh'].setValue(this.limitDecimals(100.0 / vehicleEfficiency.cityE, 2))
      this.formControls['highwayMpKwh'].setValue(this.limitDecimals(100.0 / vehicleEfficiency.highwayE, 2))

      this.formControls['cityMpg'].setValue(this.limitDecimals(vehicleEfficiency.city08U, 2))
      this.formControls['highwayMpg'].setValue(this.limitDecimals(vehicleEfficiency.highway08U, 2))

      this.formControls['selectedFuelType'].setValue(FuelType.Electric)
    }
    else {
      this.formControls['cityMpg'].setValue(this.limitDecimals(vehicleEfficiency.city08U, 2))
      this.formControls['highwayMpg'].setValue(this.limitDecimals(vehicleEfficiency.highway08U, 2))

      this.formControls['cityMpkwh'].setValue(this.limitDecimals(vehicleEfficiency.city08U / 33.705, 2))
      this.formControls['highwayMpKwh'].setValue(this.limitDecimals(vehicleEfficiency.highway08U/ 33.705, 2))

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

interface StatsForm {
  cityMpg: FormControl<string>;
  highwayMpg: FormControl<string>;
  cityMpkwh: FormControl<string>;
  highwayMpKwh: FormControl<string>;
  selectedFuelType: FormControl<FuelType>;
}