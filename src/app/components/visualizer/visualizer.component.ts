import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssetService } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent  implements OnInit {

  private symbol: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService
  ) {
    const symbol = this.activatedRoute.snapshot.paramMap.get('symbol');
    this.symbol = symbol ? symbol : '';
  }

  ngOnInit() {}

  ionViewWillLeave() {
    this.assetService.switchAssets('');
    this.assetService.chartViewActive = false;
  }

  ionViewWillEnter() {
    this.assetService.switchAssets(this.symbol);
  }
}
