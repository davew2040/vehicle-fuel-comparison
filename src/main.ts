import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { VehicleComparisonComponent } from './app/vehicle-comparison/vehicle-comparison.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
