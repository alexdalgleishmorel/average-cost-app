import { Component, OnInit } from '@angular/core';
import { AssetService } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
})
export class VisualizerComponent  implements OnInit {

  constructor(private assetService: AssetService) {}

  ngOnInit() {}

  ionViewWillLeave() {
    this.assetService.updateCurrentAsset({ symbol: '' });
  }
}
