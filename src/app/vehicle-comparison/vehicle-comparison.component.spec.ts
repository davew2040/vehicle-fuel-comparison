import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleComparisonComponent } from './vehicle-comparison.component';

describe('VehicleComparisonComponent', () => {
  let component: VehicleComparisonComponent;
  let fixture: ComponentFixture<VehicleComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
