import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { ValueDate } from '../../common/enums';
import { MainPhenomenon } from '../../common/phenomenon';
import { PullTabComponent } from '../../components/pull-tab/pull-tab.component';
import { DataPoint, Substance, UserLocation } from '../../Interfaces';
import { BelAqiIndexResult, BelAQIService } from '../../services/bel-aqi.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { AnnualMeanValueService } from '../../services/value-provider/annual-mean-value.service';
import { ModelledValueService } from '../../services/value-provider/modelled-value.service';
import moment from 'moment';

interface IndexValueResult extends BelAqiIndexResult {
    value: number;
}

marker('v2.screens.app-info.ozon');
marker('v2.screens.app-info.nitrogen-dioxide');
marker('v2.screens.app-info.fine-dust');
marker('v2.screens.app-info.very-fine-dust');
marker('v2.screens.app-info.belaqi-title');

@Component({
    selector: 'app-main-screen',
    templateUrl: './main-screen.component.html',
    styleUrls: ['./main-screen.component.scss', './main-screen.component.hc.scss'],
    animations: []
})
export class MainScreenComponent implements OnInit {
    @ViewChild('backButton') backButton: ElementRef<HTMLElement>;
    @ViewChild(PullTabComponent) pullTab;

    // location data
    locations: UserLocation[] = [];

    // belAqi data
    belAqiForCurrentLocation: BelAqiIndexResult[] = [];
    currentActiveIndex: BelAqiIndexResult;

    valueTimeline: BelAqiIndexResult[] = [];
    selectedResult: IndexValueResult;

    detailedPhenomenona: Substance[] = [
        {
            name: 'v2.screens.app-info.nitrogen-dioxide',
            abbreviation: 'NO₂',
            unit: 'µg/m³',
            phenomenon: MainPhenomenon.NO2
        },
        {
            name: 'v2.screens.app-info.fine-dust',
            abbreviation: 'PM 10',
            unit: 'µg/m³',
            phenomenon: MainPhenomenon.PM10
        },
        {
            name: 'v2.screens.app-info.very-fine-dust',
            abbreviation: 'PM 2.5',
            unit: 'µg/m³',
            phenomenon: MainPhenomenon.PM25
        },
        {
            name: 'v2.screens.app-info.ozon',
            abbreviation: 'O₃',
            unit: 'µg/m³',
            phenomenon: MainPhenomenon.O3
        },
    ];

    // horizontal slider data
    slidesData = [
        {
            icon: '/assets/images/icons/sport-kleur.svg',
            title: 'Sporttip',
            text:
                '106 µg/m³ berekend op jouw locatie, gemiddeld is dit 78 µg/m³.',
        },
        {
            icon: '/assets/images/icons/sport-kleur.svg',
            title: 'Sporttip',
            text:
                '106 µg/m³ berekend op jouw locatie, gemiddeld is dit 78 µg/m³.',
        },
        {
            icon: '/assets/images/icons/sport-kleur.svg',
            title: 'Sporttip',
            text:
                '106 µg/m³ berekend op jouw locatie, gemiddeld is dit 78 µg/m³.',
        },
    ];

    // keep track of loading status
    detailDataLoadig = false;

    detailData: DataPoint[] = [];

    belaqiDetailData: DataPoint;

    drawerOptions: any;

    protected belAqi = 10;

    detailPoint: DataPoint = null;
    detailActive = false;
    contentHeight = 0;
    screenHeight = 0;

    iosPadding = 0;
    pullTabOpen = false;

    constructor(
        public userSettingsService: UserSettingsService,
        private translateService: TranslateService,
        private belAqiService: BelAQIService,
        private modelledValueService: ModelledValueService,
        private annulMeanValueService: AnnualMeanValueService,
        private platform: Platform,
        public router: Router,
    ) {
        this.registerBackButtonEvent();

        this.locations = this.userSettingsService.getUserSavedLocations();

        this.userSettingsService.$userLocations.subscribe((locations) => {
            this.updateCurrentLocation();
            return this.locations = locations;
        });
    }

    registerBackButtonEvent() {
        this.platform.backButton.subscribe(() => {
            if (this.router.url === '/main') {
                if (this.detailActive) {
                    let el: HTMLElement = this.backButton.nativeElement;
                    el.click();
                } else {
                    if (this.pullTabOpen) this.closeTabAction();
                    else navigator['app'].exitApp();
                }
            }
        });
    }

    backDetailAction() {
        this.detailActive = false;
        this.detailPoint = null;
    }

    closeTabAction() {
        this.pullTab.handlePan({ additionalEvent: 'pandown', center: { y: 0 } })
    }

    private updateCurrentLocation(loadFinishedCb?: () => any) {
        if (this.userSettingsService.selectedUserLocation) {
            return this.belAqiService.getIndexScoresAsObservable(this.userSettingsService.selectedUserLocation).subscribe(
                res => {
                    // Handling if there is null data main timeline
                    const data = res.filter(e => e !== null);
                    const belAqiData = [...res];
                    belAqiData.forEach((item, index) => {
                        if (!item) belAqiData[index] = {indexScore: 0, location: data[0].location, valueDate: index }
                    })

                    this.belAqiForCurrentLocation = belAqiData;
                    this.updateDetailData(loadFinishedCb);
                }, error => {
                    console.error('Error occured while fetching the bel aqi indicies');
                    if (loadFinishedCb) { loadFinishedCb(); }
                });
        } else {
            this.belAqiService.activeIndex = null;
        }
    }

    private async updateDetailData(loadFinishedCb?: () => any) {
        this.detailDataLoadig = true;

        let currentBelAqi = this.belAqiForCurrentLocation.find(e => e.valueDate === ValueDate.CURRENT);
        // if current is not available
        if (currentBelAqi === undefined && this.belAqiForCurrentLocation.length > 0) {
            currentBelAqi = this.belAqiForCurrentLocation[0];
        }
        this.belAqiService.activeIndex = currentBelAqi;

        this.belaqiDetailData = {
            color: this.belAqiService.getLightColorForIndex(currentBelAqi.indexScore),
            evaluation: this.belAqiService.getLabelForIndex(currentBelAqi.indexScore),
            location: this.userSettingsService.selectedUserLocation,
            mainTab: true,
            showValues: false,
            showThreshold: false,
            euBenchMark: null,
            worldBenchMark: null,
            substance: {
                name: 'v2.screens.app-info.belaqi-title',
                abbreviation: 'BelAQI',
                phenomenon: MainPhenomenon.BELAQI
            }
        };

        this.annulMeanValueService.getLastValue(this.userSettingsService.selectedUserLocation, MainPhenomenon.BELAQI).subscribe(
            value => {
                this.belaqiDetailData.lastAnnualIndex = {
                    color: this.belAqiService.getLightColorForIndex(value.index),
                    label: this.belAqiService.getLabelForIndex(value.index)
                };
            })

        this.detailedPhenomenona.forEach(dph => {
            forkJoin([
                this.modelledValueService.getCurrentValue(this.userSettingsService.selectedUserLocation, dph.phenomenon),
                this.annulMeanValueService.getLastValue(this.userSettingsService.selectedUserLocation, dph.phenomenon)
            ]).subscribe(
                res => {
                    if (res[0] != null) {
                        const entry = {
                            location: this.userSettingsService.selectedUserLocation,
                            currentValue: Math.round(res[0].value),
                            averageValue: res[1] ? Math.round(res[1].value) : null,
                            substance: dph,
                            mainTab: true,
                            showValues: false,
                            showThreshold: false,
                            euBenchMark: null,
                            worldBenchMark: null,
                            evaluation: this.belAqiService.getLabelForIndex(res[0].index),
                            color: this.belAqiService.getLightColorForIndex(res[0].index)
                        };
                        const idx = this.detailData.findIndex(e => e.substance === dph);
                        if (idx > -1) {
                            this.detailData[idx] = entry;
                        } else {
                            this.detailData.push(entry);
                        }
                    }
                    this.detailDataLoadig = false;
                    if (loadFinishedCb) { loadFinishedCb(); }
                },
                error => {
                    console.error(error);
                    if (loadFinishedCb) { loadFinishedCb(); }
                });
        });
    }

    ngOnInit() {
        this.drawerOptions = {
            handleHeight: 150,
            gap: 120,
            thresholdFromBottom: 300,
            thresholdFromTop: 50,
            bounceBack: true,
        };
        this.contentHeight =
            this.platform.height() - this.drawerOptions.handleHeight - 56;
        this.screenHeight = this.platform.height();

        if (this.platform.is('ios')) this.iosPadding = 50;
    }

    ionViewWillEnter() {
        this.updateCurrentLocation();
    }

    doRefresh(event) {
        this.updateCurrentLocation(() => event.target.complete());
    }

    onLocationChange(location: UserLocation) {
        this.userSettingsService.selectedUserLocation = location;
        this.updateCurrentLocation();
    }

    onDayChange(index: BelAqiIndexResult) {
        this.currentActiveIndex = index;
        this.belAqiService.activeIndex = index;
    }

    openDetails(selectedDataPoint: DataPoint) {
        this.detailActive = true;
        this.detailPoint = selectedDataPoint;
        this.modelledValueService.getValueTimeline(
            this.userSettingsService.selectedUserLocation,
            selectedDataPoint.substance.phenomenon
        ).subscribe(res => {
            // Handling if there is null data in details
            const belAqiData = [...res];
            belAqiData.forEach((item, index) => {
                if (!item) belAqiData[index] = {index: 0, value: 0, valueDate: index, date: moment() }
            })
            this.valueTimeline = belAqiData
                .filter(e => e !== null)
                .map(e => ({
                    date: e.date,
                    indexScore: e.index,
                    value: e.value,
                    valueDate: e.valueDate,
                    location: this.userSettingsService.selectedUserLocation,
                }));
        });
    }

    openBelaqiDetails() {
        this.detailActive = true;
        this.detailPoint = this.belaqiDetailData;
        this.valueTimeline = this.belAqiForCurrentLocation;
    }

    onDetailsDayChange(index: IndexValueResult) {
        this.selectedResult = index;
    }

    useLocation(location: UserLocation) {
        if (location) {
            this.userSettingsService.addUserLocation(location);
        }
    }

    updateClicked(value: boolean) {
        this.pullTabOpen = value
    }
}
