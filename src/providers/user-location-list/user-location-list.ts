import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Point } from 'geojson';

export interface UserLocation {
  id: number;
  point: Point;
  label: string;
}

const STORAGE_KEY = 'userlocation';

@Injectable()
export class UserLocationListProvider {

  private userLocations: UserLocation[];

  constructor(
    protected storage: Storage
  ) {
    this.loadLocations().then(res => this.userLocations = res ? res : []);;
  }

  public addLocation(label: string, point: Point) {
    this.userLocations.push({
      label,
      point,
      id: new Date().getTime()
    });
    this.storeLocations();
  }

  public getLocationsPromise(): Promise<UserLocation[]> {
    return this.loadLocations();
  }

  public getLocations(): UserLocation[] {
    return this.userLocations;
  }

  public removeLocation(userLocation: UserLocation) {
    this.userLocations = this.userLocations.filter(res => res.id !== userLocation.id);
    this.storeLocations();
  }

  public hasLocations(): boolean {
    return this.userLocations && this.userLocations.length > 0;
  }

  public saveLocation(userLocation: UserLocation) {
    const index = this.userLocations.findIndex(res => res.id === userLocation.id);
    this.userLocations[index] = userLocation;
    this.storeLocations();
  }

  private storeLocations() {
    this.storage.set(STORAGE_KEY, this.userLocations);
  }

  private loadLocations(): Promise<UserLocation[]> {
    return this.storage.get(STORAGE_KEY);
  }

}
