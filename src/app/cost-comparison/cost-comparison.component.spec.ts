import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostComparisonComponent } from './cost-comparison.component';

describe('CostComparisonComponent', () => {
  let component: CostComparisonComponent;
  let fixture: ComponentFixture<CostComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostComparisonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
