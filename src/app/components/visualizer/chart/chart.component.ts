import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Chart from 'chart.js/auto';
import { firstValueFrom } from 'rxjs';
import { AssetInformation, AssetService, ChartDataPoint } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit {

  public lineChart?: any;

  public calculatedAverageCost: number = 0;
  public calculatedBudget: number = 0;

  public assetInformation: AssetInformation;

  constructor(
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService
  ) {
    this.assetInformation = { symbol: this.activatedRoute.snapshot.parent?.paramMap.get('symbol')! };
  }

  ngOnInit() {
    this.assetService.currentAssetSubject.subscribe((asset: AssetInformation) => {

      if (asset.symbol !== this.assetInformation.symbol) {
        if (this.lineChart) {
          this.lineChart.destroy();
          this.lineChart = null;
        }
        return;
      }

      this.assetInformation.averageCost = asset.averageCost;
      this.assetInformation.budget = asset.budget;
      this.assetInformation.shares = asset.shares;

      if (asset.averageCost) {
        this.calculatedAverageCost = asset.averageCost;
      }

      if (this.lineChart) {
        this.updateChart();
      } else {
        this.createChart();
      }

    });

    this.assetService.updateCurrentAsset(this.assetInformation);
  }

  createChart() {

    firstValueFrom(this.assetService.getAssetPriceData()).then((data: ChartDataPoint[]) => {

      if (this.lineChart) {
        return;
      }

      const chartData = {
        labels: data.map(data => data.date),
        datasets: [
          {
            label: this.assetInformation?.symbol,
            data: data.map(dataPoint => dataPoint.value),
            fill: false,
          },
          {
            label: 'Average Cost',
            data: data.map((_dataPoint, index) => index === 0 || index === data.length - 1 ? this.calculatedAverageCost : null),
            spanGaps: true,
            borderColor: '#2dd36f',
            backgroundColor: '#28ba62',
          }
        ],
      };

      if (!this.assetInformation.averageCost) {
        chartData.datasets.pop();
      }

      // Configuration options for the chart
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 3
            }
          }
        },
        pointHitRadius: 25,
      };

      // Create the line chart
      this.lineChart = new Chart('lineChart', {
        type: 'line',
        data: chartData,
        options: options,
      });

      this.lineChart.update();
    });
  }

  updateChart() {
    const data: number[] = this.lineChart.data.datasets[0].data;

    if (!(this.lineChart.data.datasets.length > 1)) {
      this.lineChart.data.datasets.push(
        {
          label: 'Average Cost',
          data: [],
          spanGaps: true,
          borderColor: '#2dd36f',
          backgroundColor: '#28ba62',
        }
      );
    }

    this.lineChart.data.datasets[1].data = data.map((_dataPoint, index) => index === 0 || index === data.length - 1 ? this.calculatedAverageCost : null);

    this.lineChart.update();
  }

  updateAverageCost(event: any) {
    if (!this.assetInformation.budget || !this.assetInformation.shares || !this.lineChart) {
      return;
    }
    const percentBudgetSpent = (event.detail.value/100);
    this.calculatedBudget = percentBudgetSpent*this.assetInformation.budget;

    const assetPriceHistory = this.lineChart.data.datasets[0].data;
    const currentAssetMarketPrice = assetPriceHistory[assetPriceHistory.length-1];
    const sharesToBuy = this.calculatedBudget/currentAssetMarketPrice;

    const currentAssetBookValue = (this.assetInformation.averageCost || 0)*this.assetInformation.shares;
    const purchaseValue = currentAssetMarketPrice*sharesToBuy;

    this.calculatedAverageCost = (currentAssetBookValue+purchaseValue)/(this.assetInformation.shares+sharesToBuy);

    this.updateChart();
  }

  hasRequiredConfigurations() {
    return !!this.assetInformation.averageCost && !!this.assetInformation.budget && !!this.assetInformation.shares && !!this.assetInformation.symbol;
  }

  pinFormatter(value: number) {
    return `${value}%`;
  }

  formatCalculatedAverageCost() {
    return `$ ${this.calculatedAverageCost.toFixed(2)}`;
  }

  formatCalculatedBudget() {
    return `$ ${this.calculatedBudget.toFixed(2)}`;
  }
}
