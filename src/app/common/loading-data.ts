import { LoadingStatus } from "./loading-status";

export class LoadingData<T> {
  public data: T;
  public status: LoadingStatus;

  constructor(data: T, status: LoadingStatus) {
    this.data = data;
    this.status = status;
  }
}