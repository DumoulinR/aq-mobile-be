import { Component, OnInit } from '@angular/core';

import { ValueDate } from '../../common/enums';
import { UserLocation } from '../../Interfaces';
import { BelAqiIndexResult, BelAQIService } from '../../services/bel-aqi.service';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
    selector: 'app-layout-screen',
    templateUrl: './layout-screen.component.html',
    styleUrls: ['./layout-screen.component.scss'],
})
export class LayoutScreenComponent implements OnInit {
    protected belAqi = 10;

    // location data
    locations: UserLocation[] = [];
    currentLocation: UserLocation;

    // belAqi data
    private belAqiScores: BelAqiIndexResult[] = [];
    belAqiForCurrentLocation: BelAqiIndexResult[] = [];
    currentActiveIndex: BelAqiIndexResult;

    constructor(
        private userLocationsService: UserSettingsService,
        private belAqiService: BelAQIService
    ) {
        this.locations = userLocationsService.getUserSavedLocations();
        this.belAqiScores = this.belAqiService.getIndexScores(
            this.locations,
            5,
            5
        );

        // activate first location by default
        this.updateCurrentLocation(this.locations[0]);
    }

    private updateCurrentLocation(location: UserLocation) {
        this.currentLocation = location;
        this.belAqiForCurrentLocation = this.belAqiScores.filter(
            (iR) => iR.location.id === location.id
        );
        this.currentActiveIndex = this.belAqiForCurrentLocation.find(
            (iR) => iR.valueDate === ValueDate.TODAY
        );
    }

    ngOnInit() { }
}