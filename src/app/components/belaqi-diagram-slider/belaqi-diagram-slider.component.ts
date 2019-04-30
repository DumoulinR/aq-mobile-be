import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { DatasetApiInterface, DefinedTimespan, DefinedTimespanService, Timeseries, Timespan, Time } from '@helgoland/core';
import { IonSlides } from '@ionic/angular';
import { map } from 'rxjs/operators';

import { sliceStationLabel } from '../../model/helper';
import { getIDForMainPhenomenon, MainPhenomenon } from '../../model/phenomenon';
import { BelaqiIndexService } from '../../services/belaqi/belaqi.service';
import { CategorizedValueService } from '../../services/categorized-value/categorized-value.service';
import { IrcelineSettings, IrcelineSettingsService } from '../../services/irceline-settings/irceline-settings.service';
import { LocateService, LocationStatus } from '../../services/locate/locate.service';
import { NearestTimeseriesService } from '../../services/nearest-timeseries/nearest-timeseries.service';
import { NetworkAlertService } from '../../services/network-alert/network-alert.service';
import { RefreshHandler } from '../../services/refresh/refresh.service';
import { UserLocation, UserLocationListService } from '../../services/user-location-list/user-location-list.service';
import { DataEntry } from '../single-chart/single-chart.component';
import { HeaderContent } from '../slider-header/slider-header.component';

@Component({
  selector: 'belaqi-diagram-slider',
  templateUrl: './belaqi-diagram-slider.component.html',
  styleUrls: ['./belaqi-diagram-slider.component.scss'],
})
export class BelaqiDiagramSliderComponent implements OnDestroy {

  @ViewChild('slider')
  slider: IonSlides;

  @Output()
  public headerContent: EventEmitter<HeaderContent> = new EventEmitter();

  public sliderOptions = { zoom: false };

  public diagramViews: DiagramView[];

  public timespan: Timespan;

  private loadingLocations = false;
  public currentLocationError: string;

  constructor(
    private ircelineSettings: IrcelineSettingsService,
    private userLocationListService: UserLocationListService,
    private nearestStation: NearestTimeseriesService,
    private locate: LocateService,
    private refreshHandler: RefreshHandler,
    private networkAlert: NetworkAlertService,
    private api: DatasetApiInterface,
    private defTimespanSrvc: DefinedTimespanService,
    private time: Time,
    private categorizeValSrvc: CategorizedValueService,
    private belaqiSrvc: BelaqiIndexService
  ) {
    this.timespan = this.defTimespanSrvc.getInterval(DefinedTimespan.TODAY_YESTERDAY);
    this.locate.getLocationStatusAsObservable().subscribe(locationStatus => {
      if (locationStatus !== LocationStatus.DENIED) {
        this.loadBelaqis(false);
      }
    });

    this.userLocationListService.locationsChanged.subscribe(() => this.loadBelaqis(false));
    this.networkAlert.onConnected.subscribe(() => this.loadBelaqis(false));
  }

  public ngOnDestroy(): void {
    if (this.refreshHandler) { this.refreshHandler.onRefresh.unsubscribe(); }
    if (this.userLocationListService) { this.userLocationListService.locationsChanged.unsubscribe(); }
    if (this.networkAlert) { this.networkAlert.onConnected.unsubscribe(); }
  }

  private async loadBelaqis(reload: boolean) {
    if (this.userLocationListService.hasLocations() && !this.loadingLocations) {
      this.currentLocationError = null;
      this.loadingLocations = true;
      this.ircelineSettings.getSettings(reload).subscribe(
        ircelineSettings => {
          this.diagramViews = [];
          this.userLocationListService.getVisibleUserLocations().forEach((loc, i) => {
            // Init MapView
            this.diagramViews[i] = new DiagramView(
              this.nearestStation,
              this.api,
              this.time,
              this.timespan,
              this.categorizeValSrvc,
              this.belaqiSrvc
            );
            // Set MapView Location
            if (loc.type !== 'current') {
              this.setLocation(loc, i, ircelineSettings);
            } else {
              this.diagramViews[i].location = {
                type: 'current'
              };
              this.userLocationListService.determineCurrentLocation().subscribe(
                currentLoc => {
                  this.setLocation(currentLoc, i, ircelineSettings);
                  this.setHeader(0);
                },
                error => {
                  this.currentLocationError = error || true;
                }
              );
            }
          });
          setTimeout(() => {
            if (this.slider) {
              this.slider.update();
              this.slider.slideTo(0);
            }
            this.setHeader(0);
          }, 300);
          this.loadingLocations = false;
        },
        _error => {
          this.loadingLocations = false;
        });
    }
  }

  private setLocation(loc: UserLocation, i: number, ircelineSettings: IrcelineSettings) {
    this.diagramViews[i].location = {
      label: loc.label,
      date: ircelineSettings.lastupdate,
      type: loc.type,
      latitude: loc.latitude,
      longitude: loc.longitude
    };
    this.diagramViews[i].init();
  }

  private setHeader(idx: number): any {
    if (idx <= this.diagramViews.length - 1) {
      this.headerContent.emit({
        label: this.diagramViews[idx].location.label,
        date: this.diagramViews[idx].location.date,
        current: this.diagramViews[idx].location.type === 'current'
      });
    }
  }

  public slideChanged() {
    this.slider.getActiveIndex().then(idx => this.setHeader(idx));
  }

}

class DiagramView {

  public location: UserLocation;

  public entries: DiagramEntry[] = [];

  public timespan: Timespan;

  constructor(
    private nearestTimeseries: NearestTimeseriesService,
    private api: DatasetApiInterface,
    private time: Time,
    timespan: Timespan,
    private categorizeValSrvc: CategorizedValueService,
    private belaqiSrvc: BelaqiIndexService
  ) {
    this.timespan = timespan;
  }

  public init() {
    this.determineNextStationNO2();
    this.determineNextStationBC();
    this.determineNextStationO3();
    this.determineNextStationPM25();
    this.determineNextStationPM10();
  }

  public stepBack() {
    this.timespan = this.time.stepBack(this.timespan);
    this.adjustTimespan();
  }

  public stepForward() {
    this.timespan = this.time.stepForward(this.timespan);
    this.adjustTimespan();
  }

  public adjustTimespan() {
    this.entries.forEach(e => {
      this.fetchData(e, this.handleError);
    });
  }

  private determineNextStationPM10() {
    const pm10Entry: DiagramEntry = {
      loading: true,
      label: '',
      data: [],
      phenomenon: MainPhenomenon.PM10
    };
    this.entries.push(pm10Entry);
    this.determineNextStation(
      pm10Entry,
      (series) => pm10Entry.label = this.createLabel(series),
      (error) => this.handleError(error)
    );
  }

  private determineNextStationPM25() {
    const pm25Entry: DiagramEntry = {
      loading: true,
      label: '',
      data: [],
      phenomenon: MainPhenomenon.PM25
    };
    this.entries.push(pm25Entry);
    this.determineNextStation(
      pm25Entry,
      (series) => pm25Entry.label = this.createLabel(series),
      (error) => this.handleError(error)
    );
  }

  private determineNextStationO3() {
    const o3Entry: DiagramEntry = {
      loading: true,
      label: '',
      data: [],
      phenomenon: MainPhenomenon.O3
    };
    this.entries.push(o3Entry);
    this.determineNextStation(
      o3Entry,
      (series) => o3Entry.label = this.createLabel(series),
      (error) => this.handleError(error)
    );
  }

  private determineNextStationBC() {
    const bcEntry: DiagramEntry = {
      loading: true,
      label: '',
      data: [],
      phenomenon: MainPhenomenon.BC
    };
    this.entries.push(bcEntry);
    this.determineNextStation(
      bcEntry,
      (series) => bcEntry.label = this.createLabel(series),
      (error) => this.handleError(error)
    );
  }

  private determineNextStationNO2() {
    const no2Entry: DiagramEntry = {
      loading: true,
      label: '',
      data: [],
      phenomenon: MainPhenomenon.NO2
    };
    this.entries.push(no2Entry);
    this.determineNextStation(
      no2Entry,
      (series) => no2Entry.label = this.createLabel(series),
      (error) => this.handleError(error)
    );
  }

  private setColor(phenomenon: MainPhenomenon, value: number): string {
    switch (phenomenon) {
      case MainPhenomenon.NO2:
      case MainPhenomenon.O3:
        return this.belaqiSrvc.getColorForIndex(this.categorizeValSrvc.categorize(value, phenomenon));
      default:
        return 'grey';
    }
  }

  private handleError(error: any) {
    // TODO what should happen?
  }

  private createLabel(series: Timeseries): string {
    return `${series.parameters.phenomenon.label} @ ${sliceStationLabel(series.station)}`;
  }

  private determineNextStation(
    entry: DiagramEntry,
    setLabel: (series: Timeseries) => void,
    setError: (error: any) => void
  ) {
    entry.loading = true;
    this.nearestTimeseries.determineNextTimeseries(
      this.location.latitude, this.location.longitude,
      getIDForMainPhenomenon(entry.phenomenon)
    ).subscribe(nearest => {
      entry.series = nearest.series;
      setLabel(nearest.series);
      this.fetchData(entry, setError);
    });
  }

  private fetchData(
    entry: DiagramEntry,
    setError: (error: any) => void
  ) {
    this.api.getTsData<{
      timestamp: number;
      value: number;
    }>(entry.series.id, entry.series.url, this.timespan)
      .pipe(map(res => this.mapValues(res, entry.phenomenon)))
      .subscribe(
        res => entry.data = res,
        error => setError(error),
        () => entry.loading = false
      );
  }

  private mapValues(res, phenomenon: MainPhenomenon): DataEntry[] {
    return res.values.map(e => {
      return {
        timestamp: e.timestamp,
        value: e.value,
        color: this.setColor(phenomenon, e.value)
      } as DataEntry;
    });
  }
}

class DiagramEntry {

  loading: boolean;
  data: DataEntry[];
  label: string;
  series?: Timeseries;
  phenomenon: MainPhenomenon;

}