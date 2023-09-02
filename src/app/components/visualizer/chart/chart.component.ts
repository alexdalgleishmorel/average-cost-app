import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Chart from 'chart.js/auto';
import { AssetInformation, AssetService, ChartDataPoint } from 'src/app/services/asset/asset.service';

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

  public calculatedAverageCost: number = 0;
  public calculatedBudget: number = 0;

  public assetInformation: AssetInformation;

  public networthBookValue: number = 0;
  public networthMarketValue: number = 0;

  averageCostPlugin = {
    id: 'average-cost-plugin',
    afterDraw: (chart: any) => {
      if (chart.config.type !== 'line') {
        return;
      }
  
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const yValue = yAxis.getPixelForValue(this.assetInformation.symbol !== 'NETWORTH' ? this.calculatedAverageCost : this.calculatedBudget);
  
      ctx.save();
      ctx.strokeStyle = '#2dd36f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(chart.chartArea.left, yValue);
      ctx.lineTo(chart.chartArea.right, yValue);
      ctx.stroke();
      ctx.restore();
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService
  ) {
    this.assetInformation = { symbol: this.activatedRoute.snapshot.parent?.paramMap.get('symbol')! };
  }

  ngOnInit() {
    this.assetService.currentAssetSubject.subscribe((asset: AssetInformation) => {

      if (!this.isCurrentAssetView(asset)) {
        if (this.lineChart) {
          this.lineChart.destroy();
          this.lineChart = null;
        }
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
          this.createChart(asset.history?.dataPoints ? asset.history.dataPoints : []);
        }, 1000);
      }

    });
  }

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

  updateChart() {
    this.lineChart.update();
  }

  updateAverageCost(event: any) {
    if (!this.assetInformation.budget || !this.assetInformation.shares) {
      return;
    }
    const percentBudgetSpent = (event.detail.value/100);
    this.calculatedBudget = percentBudgetSpent*this.assetInformation.budget;

    const assetPriceHistory = this.lineChart ? this.lineChart.data.datasets[0].data : this.assetService.chartValueData;
    const currentAssetMarketPrice = assetPriceHistory[assetPriceHistory.length-1];
    const sharesToBuy = this.calculatedBudget/currentAssetMarketPrice;

    const currentAssetBookValue = (this.assetInformation.averageCost || 0)*this.assetInformation.shares;
    const purchaseValue = currentAssetMarketPrice*sharesToBuy;

    this.calculatedAverageCost = (currentAssetBookValue+purchaseValue)/(this.assetInformation.shares+sharesToBuy);

    this.assetInformation.calculatedAverageCost = this.calculatedAverageCost;

    this.lineChart ? this.updateChart() : this.assetService.currentAssetSubject.next(this.assetInformation);
  }

  hasRequiredConfigurations() {
    return !!this.assetInformation.averageCost && !!this.assetInformation.budget && !!this.assetInformation.shares && !!this.assetInformation.symbol;
  }

  isCurrentAssetView(asset: AssetInformation): boolean {
    return asset.symbol === this.assetInformation.symbol;
  }

  pinFormatter(value: number): string {
    return `${value}%`;
  }

  formatCurrency(value: number) {
    return value ? currencyFormatter.format(value): '-';
  }
}
