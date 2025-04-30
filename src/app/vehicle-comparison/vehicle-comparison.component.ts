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
import { FuelPricesApiResponse } from '../models/api/fuel-prices-api-response';
import { TwoVehicleCostComparison } from '../models/two-vehicle-cost-comparison';
import { LocalStorageService } from '../services/local-storage-service';

@Component({
  selector: 'vehicle-comparison',
  templateUrl: './vehicle-comparison.component.html',
  styleUrls: ['./vehicle-comparison.component.scss'],
  standalone: true,
  imports: [TrailingDecimalsPipe, CommonModule, ReactiveFormsModule, FormsModule, TwoVehicleComparisonComponent, SingleVehicleStatsComponent, NoRoundPipe, VehiclePickerComponent, TwoVehicleComparisonComponent]
})
export class VehicleComparisonComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleOneStats') vehicleOneStats!: SingleVehicleStatsComponent;
  @ViewChild('vehicleTwoStats') vehicleTwoStats!: SingleVehicleStatsComponent;
  @ViewChild('vehiclePickerOne') vehiclePickerOne!: VehiclePickerComponent;
  @ViewChild('vehiclePickerTwo') vehiclePickerTwo!: VehiclePickerComponent;

  defaultVehicle1 : SelectedVehicle = {
    year: 2023,
    make: 'Ford',
    model: 'Mustang Mach-E RWD',
    trim: {
      text: 'Auto (A1)',
      id: 46517,
    }
  }

  defaultVehicle2: SelectedVehicle = {
    year: 2023,
    make: 'Ford',
    model: 'Escape FWD',
    trim: {
      text: 'Auto 8-spd, 3 cyl, 1.5 L, Turbo',
      id: 46324,
    }
  }

  numberForm: FormGroup;
  costSummary: CostSummary = new CostSummary(1, 1, 1, 1, 1)
  destroy$: Subject<void>;

  vehicleOneStats$: Subject<SingleVehicleStatsData> = new Subject<SingleVehicleStatsData>();
  vehicleTwoStats$: Subject<SingleVehicleStatsData> = new Subject<SingleVehicleStatsData>();

  latestEfficiencyInfo: VehicleFuelApiResponse | undefined = undefined;

  vehicleOneCostSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleTwoCostSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleComparison$: Observable<TwoVehicleCostComparison | null> | undefined;

  vehicleOneDetails$ = new BehaviorSubject<SelectedVehicleDetails | null>(null);
  vehicleTwoDetails$ = new BehaviorSubject<SelectedVehicleDetails | null>(null);

  loaded = false;

  constructor(private fb: FormBuilder, private client: HttpClient, private storage: LocalStorageService) {
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

    this.client.get<FuelPricesApiResponse>('https://www.fueleconomy.gov/ws/rest/fuelprices')
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(mapped => {
        this.numberForm.controls['costPerKwh'].setValue(mapped.electric)
        this.numberForm.controls['costPerGallon'].setValue(mapped.regular)
      });

    this.vehicleOneCostSummary$ = combineLatest([
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

      this.vehicleTwoCostSummary$ = combineLatest([
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
        this.vehicleOneCostSummary$,
        this.vehicleTwoCostSummary$,
        this.vehicleOneDetails$,
        this.vehicleTwoDetails$
      ]).pipe(
        map(([vehicleOneCosts, vehicleTwoCosts, vehicleOneDetails, vehicleTwoDetails]) => {
          if (!vehicleOneCosts || !vehicleTwoCosts || !vehicleOneDetails || !vehicleTwoDetails) {
            return null;
          }

          const comparison: TwoVehicleCostComparison = {
            cityCostDifference: vehicleOneCosts.cityCostPerMile / vehicleTwoCosts.cityCostPerMile,
            highwayCostDifference: vehicleOneCosts.highwayCostPerMile / vehicleTwoCosts.highwayCostPerMile,
            cityCost1: vehicleOneCosts.cityCostPerYear,
            cityCost2: vehicleTwoCosts.cityCostPerYear,
            highwayCost1: vehicleOneCosts.highwayCostPerYear,
            highwayCost2: vehicleTwoCosts.highwayCostPerYear,
            vehicleOne: vehicleOneDetails,
            vehicleTwo: vehicleTwoDetails
          };

          return comparison;
        })
      )

      setTimeout(() => {
        const storedVehicle1 = this.storage.getFirstVehicle();

        if (storedVehicle1) {
          this.vehiclePickerOne.initializeVehicleValues(storedVehicle1);
        }
        else {
          this.vehiclePickerOne.initializeVehicleValues(this.defaultVehicle1);
        }

        const storedVehicle2 = this.storage.getSecondVehicle();

        if (storedVehicle2) {
          this.vehiclePickerTwo.initializeVehicleValues(storedVehicle2);
        }
        else {
          this.vehiclePickerTwo.initializeVehicleValues(this.defaultVehicle2);
        }
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
    this.vehicleOneStats.setVehicleStats(newVehicle)
    this.vehicleOneDetails$.next(newVehicle)

    if (newVehicle && newVehicle.vehicleSelection !== this.defaultVehicle1) {
      this.storage.setFirstVehicle(newVehicle.vehicleSelection)
    }
  }

  setVehicleTwo(newVehicle: SelectedVehicleDetails) {
    this.vehicleTwoStats.setVehicleStats(newVehicle)
    this.vehicleTwoDetails$.next(newVehicle)

    if (newVehicle && newVehicle.vehicleSelection !== this.defaultVehicle2) {
      this.storage.setSecondVehicle(newVehicle.vehicleSelection)
    }
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
