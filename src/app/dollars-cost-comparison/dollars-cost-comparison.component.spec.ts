import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DollarsCostComparisonComponent } from './dollars-cost-comparison.component';

describe('DollarsCostComparisonComponent', () => {
  let component: DollarsCostComparisonComponent;
  let fixture: ComponentFixture<DollarsCostComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarsCostComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DollarsCostComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
