import { AfterContentInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Chart, ChartOptions } from 'chart.js';

import { BelaqiIndexProvider } from '../../providers/belaqi/belaqi';

interface ExtendedChartOptions extends ChartOptions {
  values: {
    index: number;
  }
}

@Component({
  selector: 'belaqi-wheel',
  templateUrl: 'belaqi-wheel.html'
})
export class BelaqiWheelComponent implements AfterContentInit {

  @Input()
  public index: number;

  @ViewChild('belaqiWheel') belaqiWheelCanvas: ElementRef;
  belaqiWheel: Chart;

  constructor(
    private belaqi: BelaqiIndexProvider,
    private translate: TranslateService
  ) { }

  public ngAfterContentInit(): void {
    this.drawWheel();
  }

  private drawWheel() {
    if (this.index) {
      const canvas = this.belaqiWheelCanvas.nativeElement as HTMLCanvasElement;
      this.belaqiWheel = new Chart(canvas, {
        type: 'doughnut',
        plugins: [{
          afterDraw: (chartInstance: Chart, easing: string, options?: any) => {

            const width = chartInstance.chartArea.right - chartInstance.chartArea.left;
            const height = chartInstance.chartArea.bottom - chartInstance.chartArea.top;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 5;
            const offset = radius / 2;
            const pointerColor = '#C2C2C2';

            const ctx = chartInstance.ctx;

            ctx.save();

            ctx.fillStyle = pointerColor;

            // arrow
            ctx.beginPath();
            const values = (chartInstance['chart'].options as ExtendedChartOptions).values;
            if (values.index > 0 && values.index <= 10) {
              const step = (Math.PI / 6);
              const start = 3.5 * step;
              const angle = start + values.index * step;
              const arrowGap = 0.25;
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(centerX + Math.cos(angle - arrowGap) * radius, centerY + Math.sin(angle - arrowGap) * radius);
              ctx.lineTo(centerX + Math.cos(angle) * (radius + offset), centerY + Math.sin(angle) * (radius + offset));
              ctx.lineTo(centerX + Math.cos(angle + arrowGap) * radius, centerY + Math.sin(angle + arrowGap) * radius);
              ctx.fill();
            }

            // circle
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
            ctx.fill();

            // locationLabel
            ctx.font = "1.5em Roboto";
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            // ctx.fillText(values.location, centerX, centerY - 10);

            // locationLabel
            // ctx.font = "0.7em Roboto";
            // wrapText(ctx, formatDate(values.timestamp, 'medium', 'de'), centerX, centerY + 10, 100, 20);

            // indexLabel
            ctx.font = "1em Roboto";
            wrapText(ctx, this.belaqi.getLabelForIndex(values.index), centerX, centerY, 100, 20);

            // modelledLabel
            ctx.font = "0.6em Roboto";
            wrapText(ctx, this.translate.instant('belaqi-wheel.modelled-hint'), centerX, centerY + (radius * 1.7), 100, 20);

            function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
              var words = text.split(' ');
              var line = '';

              for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                  context.fillText(line, x, y);
                  line = words[n] + ' ';
                  y += lineHeight;
                }
                else {
                  line = testLine;
                }
              }
              context.fillText(line, x, y);
            }
          }
        }],
        options: {
          tooltips: {
            enabled: false
          },
          maintainAspectRatio: false,
          rotation: 1 / 12 * 8 * Math.PI,
          legend: {
            display: false
          },
          values: {
            index: this.index
          }
        } as ExtendedChartOptions,
        data: {
          datasets: [{
            data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            backgroundColor: [
              "#0000FF",
              "#0099FF",
              "#009900",
              "#00FF00",
              "#FFFF00",
              "#FFBB00",
              "#FF6600",
              "#FF0000",
              "#990000",
              "#660000",
              '#FFFFFF'
            ]
          }]
        }
      });
    }
  }

}
