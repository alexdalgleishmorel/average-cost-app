import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssetService } from '../../services/asset/asset.service';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent {

  private symbol: string;

  constructor(private activatedRoute: ActivatedRoute, private assetService: AssetService) {
    this.symbol = this.activatedRoute.snapshot.paramMap.get('symbol') || '';
  }

  /**
   * Determines whether the current visualizer view is the user networth history.
   * 
   * @returns {boolean} Whether the current view is the networth history view.
   */
  isNetworthView(): boolean {
    return this.symbol === 'NETWORTH';
  }

  /**
   * Handles logic before leaving the visualizer page.
   */
  ionViewWillLeave() {
    this.assetService.switchAssets('');
    this.assetService.chartViewActive = false;
  }

  /**
   * Handles logic before the user enters the visualizer page.
   */
  ionViewWillEnter() {
    this.assetService.switchAssets(this.symbol);
  }
}
