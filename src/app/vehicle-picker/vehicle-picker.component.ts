import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, Signal, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, FormsModule  } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, filter, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { DefaultApiResponse, MenuItemApiResponse, Trim } from '../models/api/fuel-economy-gov-types';
import { VehicleFuelApiResponse } from '../models/vehicle-fuel-api-response';
import { SelectedVehicle } from '../models/selected-vehicle';
import { SelectedVehicleDetails } from '../models/selected-vehicle-details';

@Component({
  selector: 'app-vehicle-picker',
  templateUrl: './vehicle-picker.component.html',
  styleUrl: './vehicle-picker.component.scss',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule]
})
export class VehiclePickerComponent {
  @Output()
  vehicleSelected = new EventEmitter<SelectedVehicleDetails>();

  @Input()
  buttonText: string = "Set Vehicle"

  vehicleSearchForm: FormGroup;
  destroy$: Subject<void>;
  loaded = false; // TODO - determine if necessary

  availableYears$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  availableMakes$: Observable<string[]>;
  availableModels$: Observable<string[]>;
  availableTrims$: Observable<Trim[]>;

  efficiencyInfo$: Observable<VehicleFuelApiResponse | undefined>;

  constructor(private fb: FormBuilder, private client: HttpClient) {
    this.destroy$ = new Subject<void>();

    this.vehicleSearchForm = this.fb.group({
      year: [undefined],
      make: [undefined],
      model: [undefined],
      trim: [undefined]
    })

    this.availableMakes$ = this.vehicleSearchForm.controls['year'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['year'].value))
    .pipe(
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
                  if (!r) {
                    return [] as string[]
                  }

                  return r?.menuItem.map(i => i.text)
                })
              )
          ));
        }));

  this.availableModels$ = combineLatest([
    this.vehicleSearchForm.controls['year'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['year'].value)),
    this.vehicleSearchForm.controls['make'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['make'].value))
  ])
    .pipe(
      map( ([year, make]) => ({
        year: year,
        make: make
      })),
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
                  if (!r) {
                    return [] as string[]
                  }

                  return r?.menuItem.map(i => i.text)
                })
              )
          ));
        }));

  this.availableTrims$ = combineLatest([
    this.vehicleSearchForm.controls['year'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['year'].value)),
    this.vehicleSearchForm.controls['make'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['make'].value)),
    this.vehicleSearchForm.controls['model'].valueChanges
      .pipe(startWith(this.vehicleSearchForm.controls['model'].value))
  ])
    .pipe(
      tap(values => console.log("fixme availableTrims tap", values)),
      map( ([year, make, model]) => ({
        year: year,
        make: make,
        model: model
      })),
      tap(values => console.log("fixme availableTrims tap", values)),
      switchMap(values => {
        console.log("fixme detected trim input change", values)

        if (!values.year || !values.make || !values.model) {
          console.log("fixme detected empty trim inputs", values)
          return of([]); // or return EMPTY if you want to emit nothing
        }

        return of([])
          .pipe(
            switchMap(() => {
              console.log("fixme fetching new trim values", values);

              return this.client.get(`https://fueleconomy.gov/ws/rest/vehicle/menu/options?year=${values.year}&make=${values.make}&model=${values.model}`)
                .pipe(
                  catchError(err => {
                    console.error(err);
                    return of(undefined);
                  }),
                  map(r => {
                    if (!r) {
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
            })
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


  ngOnInit() {
    this.client.get<DefaultApiResponse>('https://fueleconomy.gov/ws/rest/vehicle/menu/year')
      .pipe(
        map(result => result.menuItem.map(text => parseInt(text.value)))
      )
      .subscribe(mapped => {
        this.availableYears$.next(mapped);
        this.loaded = true
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

      this.availableTrims$
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(newTrims => {
          console.log("fixme newTrims", newTrims)
        })

    combineLatest([
      this.vehicleSearchForm.controls['year'].valueChanges
        .pipe(startWith(this.vehicleSearchForm.controls['year'].value)),
      this.vehicleSearchForm.controls['make'].valueChanges
        .pipe(startWith(this.vehicleSearchForm.controls['make'].value)),
      this.vehicleSearchForm.controls['model'].valueChanges
        .pipe(startWith(this.vehicleSearchForm.controls['model'].value)),
      this.vehicleSearchForm.controls['trim'].valueChanges
        .pipe(startWith(this.vehicleSearchForm.controls['trim'].value)),
      this.efficiencyInfo$
    ])
    .pipe(
      takeUntil(this.destroy$),
      map(([year, make, model, trimId, efficiency]) => {
        if (year && make && model && trimId && efficiency) {
          const vehicleSelection: SelectedVehicle = {
            year, 
            make,
            model, 
            trimId
          };

          const result: SelectedVehicleDetails = {
            vehicleSelection: vehicleSelection,
            efficiencyInfo: efficiency
          };

          return result;
        }

        return null;
      }),
      filter(f => !!f)
    )
    .subscribe(selectedVehicleInfo => {
      this.vehicleSelected.emit(selectedVehicleInfo);
    })

    this.loaded = true
  }

  get vehicleSearchControls() {
    return this.vehicleSearchForm.controls;
  }

  selectYear(year: number): void {
    this.vehicleSearchForm.get('year')?.setValue(year);
  }

  initializeVehicleValues(newVehicle: SelectedVehicle) {
    if (!newVehicle) {
      this.vehicleSearchControls['year'].setValue(undefined);
    }
    else {
      this.vehicleSearchControls['year'].setValue(newVehicle.year);
      this.vehicleSearchControls['make'].setValue(newVehicle.make);
      this.vehicleSearchControls['model'].setValue(newVehicle.model);
      this.vehicleSearchControls['trim'].setValue(newVehicle.trimId);
    }
  }
}
