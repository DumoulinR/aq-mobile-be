import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ColorService, DatasetOptions } from '@helgoland/core';
import { Slides, Toggle } from 'ionic-angular';

import { LocatedTimeseriesService } from '../../providers/timeseries/located-timeseries';
import { UserLocationListProvider } from '../../providers/user-location-list/user-location-list';

interface LegendGroup {
  label: string;
  datasets: LegendGroupEntry[];
}

interface LegendGroupEntry {
  id: string;
  option: DatasetOptions
}

@Component({
  selector: 'nearest-series-legend-slider',
  templateUrl: 'nearest-series-legend-slider.html'
})
export class NearestSeriesLegendSliderComponent implements AfterViewInit {

  @ViewChild('slider')
  slider: Slides;

  public legendGroups: LegendGroup[] = [];

  constructor(
    private userLocations: UserLocationListProvider,
    public locatedTsSrvc: LocatedTimeseriesService,
    private color: ColorService
  ) {
    this.userLocations.getAllLocations().subscribe(locations => {
      locations.forEach((location, idx) => {
        const series: LegendGroupEntry[] = [];
        for (const key in location.nearestSeries) {
          if (location.nearestSeries.hasOwnProperty(key)) {
            const element = location.nearestSeries[key];
            series.push({
              id: element.seriesId,
              option: this.createDatasetOption(element.seriesId)
            });
          }
        }
        this.legendGroups[idx] = {
          label: location.label,
          datasets: series
        };
      });
    });
  }

  public ngAfterViewInit(): void {
    this.setCurrentIndex();
  }

  public slideChanged() {
    let idx = this.slider.getActiveIndex();
    this.locatedTsSrvc.setSelectedIndex(idx);
    this.locatedTsSrvc.removeAllDatasets();
    this.legendGroups[idx].datasets.forEach(e => this.locatedTsSrvc.addDataset(e.id, e.option));
  }

  public showSeriesSelectionChanged(toggle: Toggle) {
    this.locatedTsSrvc.setShowSeries(toggle.checked);
    if (this.locatedTsSrvc.getShowSeries()) {
      const idx = this.slider.getActiveIndex();
      this.legendGroups[idx].datasets.forEach(e => this.locatedTsSrvc.addDataset(e.id, e.option));
    } else {
      this.locatedTsSrvc.removeAllDatasets();
    }
  }

  private setCurrentIndex() {
    const temp = window.setInterval(() => {
      if (this.slider && this.slider._slides && this.slider._slides.length === this.legendGroups.length) {
        this.slider.update();
        this.slider.slideTo(this.locatedTsSrvc.getSelectedIndex());
        console.log('disabled');
        window.clearInterval(temp);
      }
    }, 10);
  }

  private createDatasetOption(id: string): DatasetOptions {
    if (this.locatedTsSrvc.datasetOptions.has(id)) {
      return this.locatedTsSrvc.datasetOptions.get(id);
    }
    const options = new DatasetOptions(id, this.color.getColor());
    options.pointRadius = 2;
    options.generalize = false;
    options.zeroBasedYAxis = true;
    return options;
  }

}
