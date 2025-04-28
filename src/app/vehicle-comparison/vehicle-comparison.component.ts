import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { TrailingDecimalsPipe } from '../pipes/trailingDecimals.pipe';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { numberValidator } from '../validators/number-validator';
import { SingleVehicleStatsComponent, SingleVehicleStatsData } from "../single-vehicle-stats/single-vehicle-stats.component";
import { VehicleFuelApiResponse } from '../models/vehicle-fuel-api-response';
import { FuelType } from '../enums/fuel-type';
import { NoRoundPipe } from "../pipes/no-round.pipe";
import { VehiclePickerComponent } from "../vehicle-picker/vehicle-picker.component";
import { SelectedVehicle } from '../models/selected-vehicle';
import { CostComparisonComponent } from '../cost-comparison/cost-comparison.component';
import { DollarsCostComparisonComponent } from '../dollars-cost-comparison/dollars-cost-comparison.component';
import { TwoVehicleComparisonComponent } from "../two-vehicle-comparison/two-vehicle-comparison.component";
import { SelectedVehicleDetails } from '../models/selected-vehicle-details';

@Component({
  selector: 'vehicle-comparison',
  templateUrl: './vehicle-comparison.component.html',
  styleUrls: ['./vehicle-comparison.component.scss'],
  standalone: true,
  imports: [TrailingDecimalsPipe, CommonModule, ReactiveFormsModule, FormsModule, TwoVehicleComparisonComponent, SingleVehicleStatsComponent, NoRoundPipe, VehiclePickerComponent, TwoVehicleComparisonComponent]
})
export class VehicleComparisonComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleOne') vehicleOne!: SingleVehicleStatsComponent;
  @ViewChild('vehicleTwo') vehicleTwo!: SingleVehicleStatsComponent;
  @ViewChild('vehiclePickerOne') vehiclePickerOne!: VehiclePickerComponent;
  @ViewChild('vehiclePickerTwo') vehiclePickerTwo!: VehiclePickerComponent;

  testVehicle1 : SelectedVehicle = {
    year: 2023,
    make: 'Ford',
    model: 'Mustang Mach-E RWD',
    trimId: 46517
  }

  testVehicle2: SelectedVehicle = {
    year: 2023,
    make: 'Ford',
    model: 'Escape FWD',
    trimId: 46324
  }

  numberForm: FormGroup;
  costSummary: CostSummary = new CostSummary(1, 1, 1, 1, 1)
  destroy$: Subject<void>;

  vehicleOneStats$: Subject<SingleVehicleStatsData> = new Subject<SingleVehicleStatsData>();
  vehicleTwoStats$: Subject<SingleVehicleStatsData> = new Subject<SingleVehicleStatsData>();

  latestEfficiencyInfo: VehicleFuelApiResponse | undefined = undefined;

  vehicleOneSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleTwoSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleComparison$: Observable<TwoVehicleCostComparison | null> | undefined;

  loaded = false;

  constructor(private fb: FormBuilder, private client: HttpClient) {
    this.destroy$ = new Subject<void>();

    this.numberForm = this.fb.group({
      milesPerGallon: ['30', [Validators.required, numberValidator()]],
      costPerGallon: ['3.00', [Validators.required, numberValidator()]],
      milesPerKwh: ['3.5', [Validators.required, numberValidator()]],
      costPerKwh: ['0.15', [Validators.required, numberValidator()]],
      milesPerYear: ['12000', [Validators.required, numberValidator()]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  get formControls() {
    return this.numberForm.controls;
  }

  ngOnInit() {
    this.combineFieldValues();

    this.vehicleOneSummary$ = combineLatest([
        this.numberForm.statusChanges.pipe(startWith('VALID')),
        this.numberForm.get('costPerKwh')!.valueChanges.pipe(startWith(this.numberForm.get('costPerKwh')!.value)),
        this.numberForm.get('costPerGallon')!.valueChanges.pipe(startWith(this.numberForm.get('costPerGallon')!.value)),
        this.numberForm.get('milesPerYear')!.valueChanges.pipe(startWith(this.numberForm.get('milesPerYear')!.value)),
        this.vehicleOneStats$
      ])
      .pipe(
        map(([status, costPerKwh, costPerGallon, milesPerYear, vehicleStats]) => {
          if (status !== 'VALID') {
            return undefined;
          }

          let costPerUnit = costPerGallon;
          if (vehicleStats.fuelType === FuelType.Electric) {
            costPerUnit = costPerKwh
          }

          console.log('vehicleStats', vehicleStats)
          console.log('costPerKwh', costPerKwh)

          console.log('cityCostPerMile', costPerUnit / vehicleStats.cityMilesPerUnit)
          console.log('highwayCostPerMile', costPerUnit / vehicleStats.highwayMilesPerUnit)

          return {
            cityCostPerMile: costPerUnit / vehicleStats.cityMilesPerUnit,
            cityCostPerYear: milesPerYear * costPerUnit / vehicleStats.cityMilesPerUnit,
            highwayCostPerMile: costPerUnit / vehicleStats.highwayMilesPerUnit,
            highwayCostPerYear: milesPerYear * costPerUnit / vehicleStats.highwayMilesPerUnit,
          } as SingleVehicleCostSummary;
        })
      )

      this.vehicleTwoSummary$ = combineLatest([
        this.numberForm.statusChanges.pipe(startWith('VALID')),
        this.numberForm.get('costPerKwh')!.valueChanges.pipe(startWith(this.numberForm.get('costPerKwh')!.value)),
        this.numberForm.get('costPerGallon')!.valueChanges.pipe(startWith(this.numberForm.get('costPerGallon')!.value)),
        this.numberForm.get('milesPerYear')!.valueChanges.pipe(startWith(this.numberForm.get('milesPerYear')!.value)),
        this.vehicleTwoStats$
      ])
      .pipe(
        map(([status, costPerKwh, costPerGallon, milesPerYear, vehicleStats]) => {
          if (status !== 'VALID') {
            return undefined;
          }

          let costPerUnit = costPerGallon;
          if (vehicleStats.fuelType === FuelType.Electric) {
            costPerUnit = costPerKwh
          }

          console.log('vehicleStats', vehicleStats)
          console.log('costPerKwh', costPerKwh)

          console.log('cityCostPerMile', costPerUnit / vehicleStats.cityMilesPerUnit)
          console.log('highwayCostPerMile', costPerUnit / vehicleStats.highwayMilesPerUnit)

          return {
            cityCostPerMile: costPerUnit / vehicleStats.cityMilesPerUnit,
            cityCostPerYear: milesPerYear * costPerUnit / vehicleStats.cityMilesPerUnit,
            highwayCostPerMile: costPerUnit / vehicleStats.highwayMilesPerUnit,
            highwayCostPerYear: milesPerYear * costPerUnit / vehicleStats.highwayMilesPerUnit,
          } as SingleVehicleCostSummary;
        })
      )

      this.vehicleComparison$ = combineLatest([
        this.vehicleOneSummary$,
        this.vehicleTwoSummary$
      ]).pipe(
        map(([vehicleOne, vehicleTwo]) => {
          if (!vehicleOne || !vehicleTwo) {
            return null;
          }

          const comparison: TwoVehicleCostComparison = {
            cityCostDifference: vehicleOne.cityCostPerMile / vehicleTwo.cityCostPerMile,
            highwayCostDifference: vehicleOne.highwayCostPerMile / vehicleTwo.highwayCostPerMile,
            cityCost1: vehicleOne.cityCostPerYear,
            cityCost2: vehicleTwo.cityCostPerYear,
            highwayCost1: vehicleOne.highwayCostPerYear,
            highwayCost2: vehicleTwo.highwayCostPerYear,
          };

          return comparison;
        })
      )

      setTimeout(() => {
        this.vehiclePickerOne.initializeVehicleValues(this.testVehicle1);
        this.vehiclePickerTwo.initializeVehicleValues(this.testVehicle2);
      }, 1)

    this.loaded = true
  }

  combineFieldValues() {
    // Create observables for each form control
    const milesPerGallon$ = this.numberForm.get('milesPerGallon')!.valueChanges.pipe(startWith(this.numberForm.get('milesPerGallon')!.value));
    const costPerGallon$ = this.numberForm.get('costPerGallon')!.valueChanges.pipe(startWith(this.numberForm.get('costPerGallon')!.value));
    const milesPerKwh$ = this.numberForm.get('milesPerKwh')!.valueChanges.pipe(startWith(this.numberForm.get('milesPerKwh')!.value));
    const costPerKwh$ = this.numberForm.get('costPerKwh')!.valueChanges.pipe(startWith(this.numberForm.get('costPerKwh')!.value));
    const milesPerYear$ = this.numberForm.get('milesPerYear')!.valueChanges.pipe(startWith(this.numberForm.get('milesPerYear')!.value));

    // Combine the latest values of the form controls
    combineLatest([
        this.numberForm.statusChanges.pipe(startWith('VALID')),
        milesPerGallon$,
        costPerGallon$,
        milesPerKwh$,
        costPerKwh$,
        milesPerYear$
      ])
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe( ([status, milesPerGallon, costPerGallon, milesPerKwh, costPerKwh, milesPerYear]) => {
        if (status !== 'VALID') {
          return;
        }

        let summary = new CostSummary(
          parseFloat(milesPerGallon),
          parseFloat(costPerGallon),
          parseFloat(milesPerKwh),
          parseFloat(costPerKwh),
          parseInt(milesPerYear)
        )

        this.costSummary = summary
      });
  }

  setVehicleOne(newVehicle: SelectedVehicleDetails) {
    this.vehicleOne.setVehicleStats(newVehicle)
  }

  setVehicleTwo(newVehicle: SelectedVehicleDetails) {
    this.vehicleTwo.setVehicleStats(newVehicle)
  }

  getTrailingDecimals(num: number) {
    let str = num.toFixed(6); // Ensure at least 6 decimal places
    return str.slice(str.indexOf('.') + 0, str.indexOf('.') + 7); // Extract 3rd to 6th decimal places
  }

  integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      const parsed = parseInt(value)

      if (Number.isNaN(parsed)) {
        return { 'notANumber': true }
      }

      if (parsed <= 0) {
        return { 'invalid': true }
      }

      return null;
    };
  }
}

interface SingleVehicleCostSummary {
    cityCostPerMile: number,
    cityCostPerYear: number,
    highwayCostPerMile: number,
    highwayCostPerYear: number
}

interface TwoVehicleCostComparison {
  cityCostDifference: number,
  highwayCostDifference: number,
  cityCost1: number,
  cityCost2: number,
  highwayCost1: number;
  highwayCost2: number;
}

class CostSummary {
  constructor(
    private milesPerGallon: number,
    private costPerGallon: number,
    private milesPerKwh: number,
    private costPerKwh: number,
    private milesPerYear: number) {
  }

  get iceCostPerMile(): number {
    return this.costPerGallon / this.milesPerGallon;
  }

  get evCostPerMile(): number {
    return this.costPerKwh / this.milesPerKwh;
  }

  get iceToEvPercentage(): number {
    return this.iceCostPerMile / this.evCostPerMile
  }

  get evToIcePercentage(): number {
    return this.evCostPerMile / this.iceCostPerMile
  }

  get iceCostPerYear(): number {
    return this.iceCostPerMile * this.milesPerYear;
  }

  get evCostPerYear(): number {
    return this.evCostPerMile * this.milesPerYear;
  }
}
