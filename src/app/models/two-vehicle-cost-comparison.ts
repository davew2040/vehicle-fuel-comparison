import { SelectedVehicleDetails } from "./selected-vehicle-details";

export interface TwoVehicleCostComparison {
  cityCostDifference: number,
  highwayCostDifference: number,
  cityCost1: number,
  cityCost2: number,
  highwayCost1: number;
  highwayCost2: number;
  vehicleOne: SelectedVehicleDetails;
  vehicleTwo: SelectedVehicleDetails;
}