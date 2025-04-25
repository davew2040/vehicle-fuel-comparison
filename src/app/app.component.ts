import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VehicleComparisonComponent } from './vehicle-comparison/vehicle-comparison.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, VehicleComparisonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  title = 'Vehicle Fuel Efficiency Comparison';
}
