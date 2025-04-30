import { Injectable } from "@angular/core";
import { SelectedVehicle } from "../models/selected-vehicle";

// Define your models here
interface VersionedData<T> {
  data: T;
  version: number;
}

interface StoredVehicle {
  vehicle: SelectedVehicle;
}

class Keys {
  static readonly FirstVehicle = "first-vehicle";
  static readonly SecondVehicle = "second-vehicle";
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  public setFirstVehicle(vehicle: SelectedVehicle): void {
    const newData: StoredVehicle = {
      vehicle: vehicle
    }

    this.genericSet(Keys.FirstVehicle, 1, newData)
  }

  public getFirstVehicle(): SelectedVehicle | null {
    const data = this.genericGet<StoredVehicle>(Keys.FirstVehicle, 1)

    return data?.vehicle ?? null;
  }

  public setSecondVehicle(vehicle: SelectedVehicle): void {
    const newData: StoredVehicle = {
      vehicle: vehicle
    }

    this.genericSet(Keys.SecondVehicle, 1, newData)
  }

  public getSecondVehicle(): SelectedVehicle | null {
    const data = this.genericGet<StoredVehicle>(Keys.SecondVehicle, 1)

    return data?.vehicle ?? null;
  }

  private genericSet<T>(key: string, version: number, data: T): void {
    const newData: VersionedData<T> = {
      data: data,
      version: version
    }

    const json = JSON.stringify(newData);

    localStorage.setItem(key, json);
  }

  private genericGet<T>(key: string, expectedVersion: number): T | null {
    const json = localStorage.getItem(key)

    if (json) {
      const parsed = JSON.parse(json) as VersionedData<T>;

      if (parsed.version === expectedVersion) {
        return parsed.data;
      }
      else {
        console.warn(`Couldn't identify compatible version for key ${key} with expected version ${expectedVersion}, so discarding.`)
        localStorage.removeItem(key)
      }
    }

    return null;
  }
}
