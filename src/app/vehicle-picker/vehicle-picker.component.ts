import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, Signal, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, FormsModule  } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, delay, distinctUntilChanged, filter, firstValueFrom, lastValueFrom, map, Observable, of, OperatorFunction, pipe, share, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { DefaultApiResponse, MenuItemApiResponse, Trim } from '../models/api/fuel-economy-gov-types';
import { VehicleFuelApiResponse } from '../models/vehicle-fuel-api-response';
import { SelectedVehicle } from '../models/selected-vehicle';
import { SelectedVehicleDetails } from '../models/selected-vehicle-details';
import { LoadingData } from '../common/loading-data';
import { LoadingStatus } from '../common/loading-status';
import { withWaitingAsync } from '../utilities/observable-helpers';


type AsyncFn<I, O> = (input: I) => Observable<O>;


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
  availableMakes$: Observable<LoadingData<string[]>>;
  availableModels$: Observable<LoadingData<string[]>>;
  availableTrims$: Observable<LoadingData<Trim[]>>;

  efficiencyInfo$: Observable<VehicleFuelApiResponse | undefined>;

  loadingStatusEnum = LoadingStatus;

  // myCustomOperator<TIn, TOut>(): OperatorFunction<TIn, TOut> {
  //   return switchMap(newYear => {
  //       if (newYear === undefined) {
  //         return of(new LoadingData<string[]>([], LoadingStatus.Loaded)); // or return EMPTY if you want to emit nothing
  //       }

  //       const loading: LoadingData<string[]> = {
  //         data: [],
  //         status: LoadingStatus.Loading
  //       }

  //       return of(new LoadingData<string[]>([], LoadingStatus.Loading))
  //         .pipe(
  //           switchMap(() =>
  //             this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${newYear}`)
  //               .pipe(
  //                 catchError(err => {
  //                   console.error(err);
  //                   return of(null); // or your own error sentinel
  //                 }),
  //                 map(r => {
  //                   if (!r) {
  //                     return new LoadingData<string[]>([], LoadingStatus.Errored);
  //                   }

  //                   const data = r?.menuItem.map(i => i.text);

  //                   return new LoadingData<string[]>(data, LoadingStatus.Loaded)
  //                 })
  //               )
  //           )
  //         );
  //       });
  // }

  constructor(private fb: FormBuilder, private client: HttpClient) {
    this.destroy$ = new Subject<void>();

    this.vehicleSearchForm = this.fb.group({
      year: [undefined],
      make: [undefined],
      model: [undefined],
      trim: [undefined]
    })

    // this.availableMakes$ = this.vehicleSearchForm.controls['year'].valueChanges
    //   .pipe(startWith(this.vehicleSearchForm.controls['year'].value))
    // .pipe(
    //   switchMap(newYear => {
    //     console.log('availableMakes$', newYear)

    //     if (newYear === undefined) {
    //       return of(new LoadingData<string[]>([], LoadingStatus.Loaded)); // or return EMPTY if you want to emit nothing
    //     }

    //     const loading: LoadingData<string[]> = {
    //       data: [],
    //       status: LoadingStatus.Loading
    //     }

    //     return of(new LoadingData<string[]>([], LoadingStatus.Loading))
    //       .pipe(
    //       switchMap(() =>
    //         this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${newYear}`)
    //           .pipe(
    //             catchError(err => {
    //               console.error(err);
    //               return of(null); // or your own error sentinel
    //             }),
    //             map(r => {
    //               if (!r) {
    //                 return new LoadingData<string[]>([], LoadingStatus.Errored);
    //               }

    //               const data = r?.menuItem.map(i => i.text);

    //               return new LoadingData<string[]>(data, LoadingStatus.Loaded)
    //             })
    //           )
    //       ));
    //     }));


    this.availableMakes$ = this.year.valueChanges
      .pipe(
        tap(fixme => console.log('fixme availableMakes input', fixme)),
        withWaitingAsync<string, LoadingData<string[]>>(
          async newYear => {
            const result = await firstValueFrom(
              this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/make?year=${newYear}`)
            ).then(response => response?.menuItem.map(i => i.text));

            return new LoadingData(result, LoadingStatus.Loaded);
          },
          new LoadingData([], LoadingStatus.Loading),
          new LoadingData([], LoadingStatus.Errored)
        ),
        share(),
        tap(fixme => console.log('fixme after waiting ', fixme)),
      );

    this.availableModels$ = combineLatest([
      this.year.valueChanges
        .pipe(startWith(this.year.value)),
      this.make.valueChanges
        .pipe(startWith(this.make.value))
    ])
      .pipe(
        map( ([year, make]) => ({
          year: year,
          make: make
        })),
        withWaitingAsync(
          async values => {
            const result = await firstValueFrom(
              this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/model?year=${values.year}&make=${values.make}`)
            ).then(response => response?.menuItem.map(i => i.text));

            return new LoadingData(result, LoadingStatus.Loaded);
          },
          new LoadingData([], LoadingStatus.Loading),
          new LoadingData([], LoadingStatus.Errored)
        ),
        share()
      );


  // this.availableModels$ = combineLatest([
  //   this.year.valueChanges
  //     .pipe(startWith(this.year.value)),
  //   this.vehicleSearchForm.controls['make'].valueChanges
  //     .pipe(startWith(this.vehicleSearchForm.controls['make'].value))
  // ])
  //   .pipe(
  //     map( ([year, make]) => ({
  //       year: year,
  //       make: make
  //     })),
  //     switchMap(values => {
  //       if (!values.year || !values.make) {
  //         return of([]); // or return EMPTY if you want to emit nothing
  //       }

  //       return of([]).pipe(
  //         switchMap(() =>
  //           this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/model?year=${values.year}&make=${values.make}`)
  //             .pipe(
  //               catchError(err => {
  //                 console.error(err);
  //                 return of(null); // or your own error sentinel
  //               }),
  //               map(r => {
  //                 if (!r) {
  //                   return [] as string[]
  //                 }

  //                 return r?.menuItem.map(i => i.text)
  //               })
  //             )
  //         ));
  //       }),
  //       share()
  //     );

  this.availableTrims$ = combineLatest([
    this.year.valueChanges
      .pipe(startWith(this.year.value)),
    this.make.valueChanges
      .pipe(startWith(this.make.value)),
    this.model.valueChanges
      .pipe(startWith(this.model.value))
  ])
    .pipe(
      //tap(values => console.log("fixme availableTrims tap", values)),
      map( ([year, make, model]) => ({
        year: year,
        make: make,
        model: model
      })),
      withWaitingAsync(
        async values => {
          const result = await firstValueFrom(
            this.client.get<DefaultApiResponse>(`https://fueleconomy.gov/ws/rest/vehicle/menu/options?year=${values.year}&make=${values.make}&model=${values.model}`)
          );

          const rDynamic = result as any;

          if (Array.isArray(rDynamic["menuItem"])) {
            const source = rDynamic["menuItem"] as MenuItemApiResponse[];

            const mapped = source.map(s => {
              const newTrim: Trim = {
                id: parseInt(s.value),
                text: s.text
              }

              return newTrim;
            });

            return new LoadingData(mapped, LoadingStatus.Loaded);
          }
          else {
            const source = rDynamic["menuItem"] as MenuItemApiResponse;

            const mapped: Trim = {
              id: parseInt(source.value),
              text: source.text
            }

            return new LoadingData([mapped], LoadingStatus.Loaded);
          }},
        new LoadingData([], LoadingStatus.Loading),
        new LoadingData([], LoadingStatus.Errored)
      ),
      share()
    );

  this.efficiencyInfo$ = this.trim.valueChanges
    .pipe(
      startWith(this.trim.value),
      switchMap(trim => {

        if (!trim) {
          return of(undefined); // or return EMPTY if you want to emit nothing
        }

        const castedTrim: Trim = trim;

        return of([])
          .pipe(
            switchMap(() =>
              this.client.get(`https://fueleconomy.gov//ws/rest/vehicle/${castedTrim.id}`)
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
        ),
        share());
  }


  ngOnInit() {
    this.year.valueChanges.subscribe(v => console.log('fixme valueChanges ', v))

    this.client.get<DefaultApiResponse>('https://fueleconomy.gov/ws/rest/vehicle/menu/year')
      .pipe(
        map(result => result.menuItem.map(text => parseInt(text.value)))
      )
      .subscribe(mapped => {
        this.availableYears$.next(mapped);
        this.loaded = true
      });

    this.year.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(newValue => {
        console.log('year changed - ', newValue)
        if (this.loaded) {
          this.make.setValue(undefined)
        }
      });

    this.make.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(newValue => {
        console.log('make changed -', newValue)
        if (this.loaded) {
          this.model.setValue(undefined)
        }
      });

      this.model.valueChanges
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(newValue => {
          console.log('model changed -', newValue)
          if (this.loaded) {
            this.trim.setValue(undefined)
          }
        });

      this.trim.valueChanges
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
      this.year.valueChanges
        .pipe(startWith(this.year.value)),
      this.make.valueChanges
        .pipe(startWith(this.make.value)),
      this.model.valueChanges
        .pipe(startWith(this.model.value)),
      this.trim.valueChanges
        .pipe(
          startWith(this.trim.value),
          map(trim => trim as Trim | undefined)
        ),
      this.efficiencyInfo$
    ])
    .pipe(
      takeUntil(this.destroy$),
      map(([year, make, model, trim, efficiency]) => {
        if (year && make && model && trim && efficiency) {
          const vehicleSelection: SelectedVehicle = {
            year,
            make,
            model,
            trim
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

  get year(): AbstractControl {
    return this.vehicleSearchForm.controls['year']
  }

  get make(): AbstractControl {
    return this.vehicleSearchForm.controls['make']
  }

  get model(): AbstractControl {
    return this.vehicleSearchForm.controls['model']
  }

  get trim(): AbstractControl {
    return this.vehicleSearchForm.controls['trim']
  }

  get vehicleSearchControls() {
    return this.vehicleSearchForm.controls;
  }

  selectYear(year: number): void {
    this.vehicleSearchForm.get('year')?.setValue(year);
  }

  initializeVehicleValues(newVehicle: SelectedVehicle) {
    if (!newVehicle) {
      this.year.setValue(undefined);
    }
    else {
      this.year.setValue(newVehicle.year);
      this.make.setValue(newVehicle.make);
      this.model.setValue(newVehicle.model);
      this.trim.setValue(newVehicle.trim);
    }
  }
}
