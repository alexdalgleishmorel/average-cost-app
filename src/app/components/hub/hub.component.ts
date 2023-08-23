import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AssetInformation, AssetService } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-hub',
  templateUrl: './hub.component.html',
  styleUrls: ['./hub.component.scss'],
})
export class HubComponent {

  public assets: AssetInformation[];

  constructor(
    private assetService: AssetService,
    private router: Router
  ) {
    this.assets = this.assetService.getAllAssets();
  }

  ngOnInit() {
  }

  assetSelected(asset: AssetInformation) {
    this.assetService.updateCurrentAsset(asset);
    this.router.navigate([`/visualizer/${asset.symbol}`]);
  }

  formatMoneyValue(value: number|undefined) {
    return !value ? '-' : `$ ${value.toFixed(2)}`;
  }
}
