import { Trim } from "./api/fuel-economy-gov-types";

export interface SelectedVehicle {
  year: number;
  make: string;
  model: string;
  trim: Trim;
}
