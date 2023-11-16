import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AssetInformation, AssetService, NetworthMetaData } from 'src/app/services/asset/asset.service';
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
  public networthMetaData?: NetworthMetaData;

  constructor(
    private assetService: AssetService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    assetService.networthMetaDataSubject.subscribe(networthMetaData => {
      this.networthMetaData = networthMetaData;
    });
  }

  /**
   * Retrieves all assets when the hub is navigated to.
   */
  ionViewWillEnter() {
    this.assets = this.assetService.getAllAssets();
  }

  /**
   * Handles an asset being selected in the hub.
   * 
   * @param {AssetInformation} asset The asset that was selected.
   */
  public assetSelected(asset: AssetInformation) {
    this.router.navigate([`/visualizer/${asset.symbol}`]);
  }

  /**
   * Handles the networth information section being selected.
   */
  public networthSelected() {
    if (this.networthMetaData) {
      this.router.navigate([`/visualizer/NETWORTH`]);
    }
  }

  /**
   * Removes the given asset.
   * 
   * @param {AssetInformation} asset The asset to remove. 
   */
  public removeAsset(asset: AssetInformation) {
    this.assetService.removeAsset(asset.symbol);
    this.assets = this.assetService.getAllAssets();
  }

  /**
   * Takes a number and formats it into a currency format. Undefined values format to '-'.
   * 
   * @param {number|undefined} value The value to format.
   * 
   * @returns {string} The formatted currency representation.
   */
  public formatMoneyValue(value: number|undefined): string {
    return !value ? '-' : currencyFormatter.format(value);
  }

  /**
   * Opens a modal for creating a new asset.
   */
  async openAssetCreationModal() {
    let modal = await this.modalCtrl.create({
      component: AssetCreationModalComponent
    });
    modal.present();
  }

  /**
   * Takes an asset and determines its market value, based on the latest market price and the number of shares owned.
   * 
   * @param {AssetInformation} asset The asset information.
   * 
   * @returns {number} The market value of the asset.
   */
  getAssetMarketValue(asset: AssetInformation): number {
    return asset.shares ? asset.shares*(asset.history?.dataPoints[asset.history.dataPoints.length-1].value || 0) : 0;
  }

  /**
   * Takes an asset and determines the difference between the book and market value, based on the number of shares owned.
   * 
   * @param {AssetInformation} asset The asset information.
   * 
   * @returns {number} The difference between the book and market value.
   */
  getAssetMarketValueChange(asset: AssetInformation): number {
    if (!asset.shares || !asset.averageCost) {
      return 0;
    }
    const marketPrice = asset.history?.dataPoints[asset.history.dataPoints.length-1].value || 0;
    return ((asset.shares * marketPrice) - (asset.shares * asset.averageCost))/(asset.shares * asset.averageCost);
  }

  /**
   * Determines the difference between the book and market value of the user's networth.
   * 
   * @returns {number} The difference between the book and market value of the user networth.
   */
  getNetworthChange(): number {
    return this.networthMetaData ? (this.networthMetaData.marketValue-this.networthMetaData.bookValue)/this.networthMetaData.bookValue : 0;
  }

  /**
   * Takes a number value and formats it into a percentage value.
   * 
   * @param {number} change A number value representing a change.
   * 
   * @returns {string} The formatted change value.
   */
  formatChangeValue(change: number): string {
    return !change ? '' : `${(change*100).toFixed(2)}%`;
  }

  /**
   * Determines whether the api key is currently configured for the application
   * 
   * @returns {boolean} Whether the api key is configured
   */
  apiKeyConfigured(): boolean {
    return !!this.assetService.getApiKey();
  }

  /**
   * Navigates the user to the main settings page
   */
  navigateToSettings() {
    this.router.navigate(['', 'settings']);
  }
}
