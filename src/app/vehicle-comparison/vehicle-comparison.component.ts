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

@Component({
  selector: 'vehicle-comparison',
  templateUrl: './vehicle-comparison.component.html',
  styleUrls: ['./vehicle-comparison.component.scss'],
  standalone: true,
  imports: [TrailingDecimalsPipe, CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, SingleVehicleStatsComponent, NoRoundPipe]
})
export class VehicleComparisonComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleOne') vehicleOne!: SingleVehicleStatsComponent;

  numberForm: FormGroup;
  vehicleSearchForm: FormGroup;
  costSummary: CostSummary = new CostSummary(1, 1, 1, 1, 1)
  destroy$: Subject<void>;

  vehicleOneStats$: Subject<SingleVehicleStatsData> = new Subject<SingleVehicleStatsData>();

  availableYears$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  availableMakes$: Observable<string[]>;
  availableModels$: Observable<string[]>;
  availableTrims$: Observable<Trim[]>;

  latestEfficiencyInfo: VehicleFuelApiResponse | undefined = undefined;

  efficiencyInfo$: Observable<VehicleFuelApiResponse | undefined>;

  vehicleOneSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleTwoSummary$: Observable<SingleVehicleCostSummary | undefined> | undefined;
  vehicleComparison$: Observable<TwoVehicleCostComparison | undefined> | undefined;

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

    this.vehicleSearchForm = this.fb.group({
      year: [2024],
      make: ['Ford'],
      model: ['Mustang Mach-E RWD'],
      trim: [47822]
    })

    this.availableMakes$ = this.vehicleSearchForm.controls['year'].valueChanges
      .pipe(
        startWith(this.vehicleSearchForm.controls['year'].value),
        distinctUntilChanged(),
        switchMap(newYear => {
          console.log('availableMakes$', newYear)

          if (newYear === undefined) {
            return of([]); // or return EMPTY if you want to emit nothing
          }

          return of([]).pipe(
            switchMap(() =>
              this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${newYear}`)
                .pipe(
                  catchError(err => {
                    console.error(err);
                    return of(null); // or your own error sentinel
                  }),
                  map(r => {
                    if (r === null) {
                      return [] as string[]
                    }

                    return r?.menuItem.map(i => i.text)
                  })
                )
            ));
          }));

    this.availableModels$ = combineLatest([
      this.vehicleSearchForm.controls['year'].valueChanges,
      this.vehicleSearchForm.controls['make'].valueChanges
    ])
      .pipe(
        map( ([year, make]) => ({
          year: year,
          make: make
        })),
        startWith({
          year: this.vehicleSearchForm.controls['year'].value,
          make: this.vehicleSearchForm.controls['make'].value
        }),
        switchMap(values => {
          if (!values.year || !values.make) {
            return of([]); // or return EMPTY if you want to emit nothing
          }

          return of([]).pipe(
            switchMap(() =>
              this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/model?year=${values.year}&make=${values.make}`)
                .pipe(
                  catchError(err => {
                    console.error(err);
                    return of(null); // or your own error sentinel
                  }),
                  map(r => {
                    if (r === null) {
                      return [] as string[]
                    }

                    return r?.menuItem.map(i => i.text)
                  })
                )
            ));
          }));

    this.availableTrims$ = combineLatest([
      this.vehicleSearchForm.controls['year'].valueChanges,
      this.vehicleSearchForm.controls['make'].valueChanges,
      this.vehicleSearchForm.controls['model'].valueChanges
    ])
      .pipe(
        map( ([year, make, model]) => ({
          year: year,
          make: make,
          model: model
        })),
        startWith({
          year: this.vehicleSearchForm.controls['year'].value,
          make: this.vehicleSearchForm.controls['make'].value,
          model: this.vehicleSearchForm.controls['model'].value,
        }),
        switchMap(values => {
          if (!values.year || !values.make || !values.model) {
            return of([]); // or return EMPTY if you want to emit nothing
          }

          return of([])
            .pipe(
              switchMap(() =>
                this.client.get(`https://fueleconomy.gov/ws/rest/vehicle/menu/options?year=${values.year}&make=${values.make}&model=${values.model}`)
                  .pipe(
                    catchError(err => {
                      console.error(err);
                      return of(null);
                    }),
                    map(r => {
                      if (r === null) {
                        return [] as Trim[]
                      }

                      const rDynamic = r as any;

                      if (Array.isArray(rDynamic["menuItem"])) {
                        const source = rDynamic["menuItem"] as MenuItemApiResponse[];

                        return source.map(s => {
                          const newTrim: Trim = {
                            id: parseInt(s.value),
                            text: s.text
                          }

                          return newTrim;
                        });
                      }
                      else {
                        const source = rDynamic["menuItem"] as MenuItemApiResponse;

                        const newTrim: Trim = {
                          id: parseInt(source.value),
                          text: source.text
                        }

                        return [newTrim];
                      }})
                    )
                  )
                );
              }
              ));

    this.efficiencyInfo$ = this.vehicleSearchForm.controls['trim'].valueChanges
      .pipe(
        startWith(this.vehicleSearchForm.controls['trim'].value),
        switchMap(trim => {
          if (!trim) {
            return of(undefined); // or return EMPTY if you want to emit nothing
          }

          return of([])
            .pipe(
              switchMap(() =>
                this.client.get(`https://fueleconomy.gov//ws/rest/vehicle/${trim}`)
                  .pipe(
                    catchError(err => {
                      console.error(err);
                      return of(undefined);
                    }),
                    map(r => r as VehicleFuelApiResponse)
                  )
                )
              );
            }
          ));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  get formControls() {
    return this.numberForm.controls;
  }

  ngOnInit() {
    this.combineFieldValues();

    this.client.get<DefaultApiResponse>('https://fueleconomy.gov/ws/rest/vehicle/menu/year')
      .pipe(
        map(result => result.menuItem.map(text => parseInt(text.value)))
      )
      .subscribe(mapped => {
        this.availableYears$.next(mapped);
      });

    this.vehicleSearchForm.controls['year'].valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(newValue => {
        console.log('year changed - ', newValue)
        if (this.loaded) {
          this.vehicleSearchForm.controls['make'].setValue(undefined)
        }
      });

    this.vehicleSearchForm.controls['make'].valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(newValue => {
        console.log('make changed -', newValue)
        if (this.loaded) {
          this.vehicleSearchForm.controls['model'].setValue(undefined)
        }
      });

      this.vehicleSearchForm.controls['model'].valueChanges
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(newValue => {
          console.log('model changed -', newValue)
          if (this.loaded) {
            this.vehicleSearchForm.controls['trim'].setValue(undefined)
          }
        });

      this.vehicleSearchForm.controls['trim'].valueChanges
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(newValue => {
          console.log('fixme trim - ', newValue)
        });

    this.efficiencyInfo$.subscribe(newValues => {
      console.log('fixme efficiency - ', newValues)
      this.latestEfficiencyInfo = newValues;
    })

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

    this.loaded = true
  }

  setVehicle(vehicleInfo: VehicleFuelApiResponse) {
    this.vehicleOne.setVehicleStats(vehicleInfo);
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

  /* vehicle search */

  get vehicleSearchControls() {
    return this.vehicleSearchForm.controls;
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
  highwayCostDifference: number
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

interface DefaultApiResponse {
  [key: string]: any;
  menuItem: { text: string, value: string }[];
}

interface TrimApiResponse {
  [key: string]: any;
  menuItem: { text: string, value: string };
}

interface MenuItemApiResponse {
  text: string,
  value: string
}

interface Trim {
  text: string,
  id: number
}
