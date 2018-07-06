import { Component } from '@angular/core';
import { Geoposition } from '@ionic-native/geolocation';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { BelaqiIndexProvider } from '../../providers/belaqi/belaqi';
import { IrcelineSettingsProvider } from '../../providers/irceline-settings/irceline-settings';
import { LocateProvider } from '../../providers/locate/locate';
import { UserLocationListProvider } from '../../providers/user-location-list/user-location-list';

interface BelaqiLocation {
  index: number;
  locationLabel: string;
  date: Date;
  isCurrent: boolean;
}

@Component({
  selector: 'belaqi-user-location-slider',
  templateUrl: 'belaqi-user-location-slider.html'
})
export class BelaqiUserLocationSliderComponent {

  public belaqiLocations: BelaqiLocation[] = [];

  constructor(
    private belaqiIndexProvider: BelaqiIndexProvider,
    private userLocationProvider: UserLocationListProvider,
    private ircelineSettings: IrcelineSettingsProvider,
    private locate: LocateProvider,
    private translate: TranslateService
  ) {
    this.loadBelaqis();
    this.loadBelaqiForCurrentLocation();
  }

  private loadBelaqiForCurrentLocation() {
    this.locate.onPositionUpdate.subscribe((pos: Geoposition) => {
      const ircelSetObs = this.ircelineSettings.getSettings(false);
      const belaqiObs = this.belaqiIndexProvider.getValue(pos.coords.latitude, pos.coords.longitude);
      forkJoin([ircelSetObs, belaqiObs]).subscribe(value => {
        const previous = this.belaqiLocations.findIndex(e => e.isCurrent) || -1;
        const current: BelaqiLocation = {
          index: value[1],
          locationLabel: this.translate.instant('belaqi-user-location-slider.current-location'),
          date: value[0].lastupdate,
          isCurrent: true
        };
        if (previous > -1) {
          this.belaqiLocations[previous] = current;
        } else {
          this.belaqiLocations.push(current);
        }
      }, error => { });
    });
  }

  private loadBelaqis() {
    this.belaqiLocations = [];
    this.ircelineSettings.getSettings(false).subscribe(ircelineSettings => {
      this.userLocationProvider.getLocationsPromise().then(
        locations => locations.forEach((loc, index) => {
          this.belaqiIndexProvider.getValue(loc.point.coordinates[1], loc.point.coordinates[0]).subscribe(
            res => {
              this.belaqiLocations.push({
                index: res,
                locationLabel: loc.label,
                date: ircelineSettings.lastupdate,
                isCurrent: false
              });
            }
          )
        })
      );
    });
  }

}
