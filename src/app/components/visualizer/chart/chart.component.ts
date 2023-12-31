import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Chart from 'chart.js/auto';
import { AssetInformation, AssetService, ChartDataPoint, Currency } from '../../../services/asset/asset.service';
import { debounceTime } from 'rxjs';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit {
  public lineChart?: any;
  public artifact: boolean = false;

  public calculatedAverageCost: number = 0;
  public calculatedBudget: number = 0;

  public assetInformation: AssetInformation;

  public networthBookValue: number = 0;
  public networthMarketValue: number = 0;

  public budgetSpentFormControl: FormControl = new FormControl(0);

  private lastDrawnAverageCost: number = 0;
  private isOverlayCanvasDrawn: boolean = false;

  afterDraw (chart: any) {
    if (chart.config.type !== 'line') {
      return;
    }

    const mainCanvas = document.getElementById('lineChart') as HTMLCanvasElement | null;
    const overlayCanvas = document.getElementById('overlay') as HTMLCanvasElement | null;
    if (!mainCanvas) return;
    if (!overlayCanvas) return;

    if (!this.isOverlayCanvasDrawn) {
      overlayCanvas.width = overlayCanvas.offsetWidth;
      overlayCanvas.height = overlayCanvas.offsetHeight;
    }

    const ctxOverlay = overlayCanvas.getContext('2d');
    if (!ctxOverlay) return;

    ctxOverlay.imageSmoothingEnabled = false;

    const yAxis = chart.scales.y;
    const xAxis = chart.scales.x;
    const yScale = overlayCanvas.height / (chart.chartArea.height+(yAxis.getPixelForValue(yAxis.max)*2));
    const xOrigin = (overlayCanvas.width / (chart.chartArea.width)) * xAxis.getPixelForValue(0);

    let yValue = yAxis.getPixelForValue(this.assetInformation.symbol !== 'NETWORTH' ? this.calculatedAverageCost : this.calculatedBudget);
    yValue = yValue * yScale;
    ctxOverlay.save();

    if (this.lastDrawnAverageCost !== this.calculatedAverageCost) {
      ctxOverlay.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      ctxOverlay.strokeStyle = '#2dd36f';
      ctxOverlay.lineWidth = 2;

      ctxOverlay.beginPath();
      ctxOverlay.moveTo(xOrigin, yValue);
      ctxOverlay.lineTo(chart.chartArea.right, yValue);
      ctxOverlay.stroke();
      ctxOverlay.restore();

      this.lastDrawnAverageCost = this.calculatedAverageCost;
      this.isOverlayCanvasDrawn = true;
    }
  }

  /**
   * Handles drawing the green average cost line overlayed over the asset chart data
   */
  averageCostPlugin = {
    id: 'average-cost-plugin',
    afterDraw: (chart: any) => {
      this.afterDraw(chart)
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService
  ) {
    this.assetInformation = { symbol: this.activatedRoute.snapshot.parent?.paramMap.get('symbol')! };
    this.budgetSpentFormControl.valueChanges.subscribe(value => {
      this.updateAverageCost(value/100);
    });
  }

  /**
   * Handles chart intialization. Contains logic that ensures only one chart view exists at a time within the application.
   */
  ngOnInit() {
    this.assetService.assetChangedNotification.subscribe(asset => {
      if (!this.isCurrentAssetView(asset)) {
        if (this.lineChart) {
          this.artifact = true;
          this.lineChart.destroy();
          this.lineChart = null;
        }
      }
    });

    this.assetService.currentAssetSubject.pipe(debounceTime(500)).subscribe((asset: AssetInformation) => {
      if (this.isCurrentAssetView(asset)) {
        this.assetService.assetChangedNotification.next(asset);
      } else {
        return;
      }

      if (this.assetInformation.symbol === 'NETWORTH') { this.calculatedBudget = asset.budget ? asset.budget : 0 }

      this.assetInformation.averageCost = asset.averageCost;
      this.assetInformation.budget = asset.budget;
      this.assetInformation.shares = asset.shares;

      if (asset.calculatedAverageCost) {
        this.calculatedAverageCost = asset.calculatedAverageCost;
      } else if (asset.averageCost) {
        this.calculatedAverageCost = asset.averageCost;
      }

      if (this.lineChart) {
        this.updateChart();
      } else {
        setTimeout(() => {
          if (!this.artifact) {
            this.createChart(asset.history?.dataPoints ? asset.history.dataPoints : []);
          }
        }, 2000);
      }
    });
  }

  /**
   * Updates the average cost value on ion slider change events
   * 
   * @param event The ion slider change event
   */
  onSliderChange(event: any) {
    this.updateAverageCost(event.detail.value/100);
  }

  /**
   * Handles logic for when the user leaves the chart view
   */
  ionViewWillLeave() {
    this.budgetSpentFormControl.setValue(0);
  }

  /**
   * Creates the chart based on the provided chart data.
   * 
   * @param {ChartDataPoint[]} data The chart data to display 
   */
  createChart(data: ChartDataPoint[]) {
    if (this.lineChart) {
      return;
    }

    const chartData = {
      labels: data.map(data => data.date),
      datasets: [
        {
          label: this.assetInformation?.symbol,
          data: data.map(dataPoint => dataPoint.value),
          borderColor: '#4dc9f6',
          backgroundColor: '#3399CC',
          pointRadius: 1.5
        },
        {
          label: this.assetInformation.symbol !== 'NETWORTH' ? 'Average Cost' : 'Book Value',
          data: [],
          borderColor: '#2dd36f',
          backgroundColor: '#28ba62'
        }
      ],
    };

    // Configuration options for the chart
    const options = {
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 3
          }
        }
      },
      pointHitRadius: 25,
      cubicInterpolationMode: 'monotone'
    };

    // Create the line chart
    if (!this.assetService.chartViewActive) {
      this.lineChart = new Chart('lineChart', {
        type: 'line',
        data: chartData,
        plugins: [this.averageCostPlugin],
        options: options,
      });
      this.assetService.chartViewActive = true;
      this.assetService.chartValueData = chartData.datasets[0].data;
    }
  }

  /**
   * Updates the current chart representation.
   */
  updateChart() {
    this.lineChart.update();
  }

  /**
   * Determines what the user's new average cost would be on the asset, based on the percentage of budget spent provided in the event
   * 
   * @param {number} budget The percentage of the budget spent.
   * @returns 
   */
  updateAverageCost(percentBudgetSpent: number) {
    if (!this.assetInformation.budget || !this.assetInformation.shares) {
      return;
    }
    this.calculatedBudget = percentBudgetSpent*this.assetInformation.budget;

    const assetPriceHistory = this.lineChart ? this.lineChart.data.datasets[0].data : this.assetService.chartValueData;
    const currentAssetMarketPrice = assetPriceHistory[assetPriceHistory.length-1];
    const sharesToBuy = this.calculatedBudget/currentAssetMarketPrice;

    const currentAssetBookValue = (this.assetInformation.averageCost || 0)*this.assetInformation.shares;
    const purchaseValue = currentAssetMarketPrice*sharesToBuy;

    this.calculatedAverageCost = (currentAssetBookValue+purchaseValue)/(this.assetInformation.shares+sharesToBuy);

    this.assetInformation.calculatedAverageCost = this.calculatedAverageCost;

    this.lineChart ? this.afterDraw(this.lineChart) : this.assetService.currentAssetSubject.next(this.assetInformation);
  }

  /**
   * Determines whether the current assetInformation values has all required attributes to perform average cost calculations
   * 
   * @returns {boolean} Whether the current assetInformation has all required values
   */
  hasRequiredConfigurations():boolean {
    return !!this.assetInformation.averageCost && !!this.assetInformation.budget && !!this.assetInformation.shares && !!this.assetInformation.symbol;
  }

  /**
   * Determines whether the user is currently trying to view the given asset.
   * 
   * @param {AssetInformation} asset The asset information.
   * 
   * @returns {boolean} Whether the user is currently trying to view the given asset.
   */
  isCurrentAssetView(asset: AssetInformation): boolean {
    return asset.symbol === this.assetInformation.symbol;
  }

  /**
   * Adds a % character to the number value on the slider pin.
   * 
   * @param {number} value A number value.
   *  
   * @returns {string} The number value with a % appended.
   */
  pinFormatter(value: number): string {
    return `${value}%`;
  }

  /**
   * Formats a number value into a currency string representation.
   * 
   * @param {number} value The currency value.
   *  
   * @returns {string} A string representation of the currency value.
   */
  formatCurrency(value: number): string {
    return value ? currencyFormatter.format(value): '-';
  }

  /**
   * Gets the currency of the current asset being viewed.
   * 
   * @returns {string} The currency of the current asset being viewed.
   */
  getAssetCurrency(): Currency {
    return this.assetService.getAsset(this.assetInformation.symbol).currency || Currency.USD;
  }

  /**
   * Determines the default curreny of the user.
   * 
   * @returns {Currency} A currency
   */
  getDefaultCurrency() {
    return this.assetService.getDefaultCurrency();
  }
}
