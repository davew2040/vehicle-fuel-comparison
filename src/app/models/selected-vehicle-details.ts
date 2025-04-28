import { SelectedVehicle } from "./selected-vehicle";
import { VehicleFuelApiResponse } from "./vehicle-fuel-api-response";

export interface SelectedVehicleDetails {
    vehicleSelection: SelectedVehicle;
    efficiencyInfo: VehicleFuelApiResponse;
}