import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AssetInformation, AssetService, NetworthInformation } from 'src/app/services/asset/asset.service';
import { AssetCreationModalComponent } from '../asset-creation-modal/asset-creation-modal.component';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

@Component({
  selector: 'app-hub',
  templateUrl: './hub.component.html',
  styleUrls: ['./hub.component.scss'],
})
export class HubComponent {

  public assets: AssetInformation[] = [];
  public networthInformation: NetworthInformation;

  constructor(
    private assetService: AssetService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    this.networthInformation = {bookValue: 0, marketValue: 0};
    assetService.networthSubject.subscribe(networthInformation => {
      this.networthInformation = networthInformation;
    });
  }

  ionViewWillEnter() {
    this.assets = this.assetService.getAllAssets();
    this.assetService.getNetworthInformation();
  }

  assetSelected(asset: AssetInformation) {
    if (asset.symbol === 'NETWORTH' && !this.assetService.getAsset('NETWORTH')) {
      return;
    }
    this.router.navigate([`/visualizer/${asset.symbol}`]);
  }

  removeAsset(asset: AssetInformation) {
    this.assetService.removeAsset(asset.symbol);
    this.assets = this.assetService.getAllAssets();
  }

  formatMoneyValue(value: number|undefined) {
    return !value ? '-' : currencyFormatter.format(value);
  }

  async openAssetCreationModal() {
    let modal = await this.modalCtrl.create({
      component: AssetCreationModalComponent
    });
    modal.present();
  }

  getNetworthChange(): number {
    return this.networthInformation.marketValue-this.networthInformation.bookValue;
  }

  formatChangeValue(change: number): string {
    return `(${currencyFormatter.format(change)})`;
  }
}
