import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleVehicleStatsComponent } from './single-vehicle-stats.component';

describe('SingleVehicleStatsComponent', () => {
  let component: SingleVehicleStatsComponent;
  let fixture: ComponentFixture<SingleVehicleStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleVehicleStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleVehicleStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
