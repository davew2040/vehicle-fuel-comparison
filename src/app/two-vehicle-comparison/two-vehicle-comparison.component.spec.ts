import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoVehicleComparisonComponent } from './two-vehicle-comparison.component';

describe('TwoVehicleComparisonComponent', () => {
  let component: TwoVehicleComparisonComponent;
  let fixture: ComponentFixture<TwoVehicleComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoVehicleComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoVehicleComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
