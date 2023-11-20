import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AssetInformation, AssetService, Currency } from '../../../services/asset/asset.service';
import { AssetDeleteConfirmationModalComponent } from '../../asset-delete-confirmation-modal/asset-delete-confirmation-modal.component';
import { RouterService } from '../../../services/router/router.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {

  public averageCostFormControl = new FormControl(0, [Validators.required]);
  public currencyFormControl = new FormControl(Currency.USD, []);
  public sharesFormControl = new FormControl(0, [Validators.required]);
  public budgetFormControl = new FormControl(0, [Validators.required]);

  public formGroup: FormGroup = this._formBuilder.group({
    averageCostFormControl: this.averageCostFormControl,
    currencyFormControl: this.currencyFormControl,
    sharesFormControl: this.sharesFormControl,
    budgetFormControl: this.budgetFormControl
  });

  public assetSymbol: string;

  public currencies: string[];

  constructor(
    private _formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService,
    private modalCtrl: ModalController,
    private router: RouterService
  ) {
    this.assetSymbol = this.activatedRoute.snapshot.parent?.paramMap.get('symbol')!;
    this.currencies = Object.keys(Currency);
  }

  /**
   * Initializes the form inputs based on the current asset information
   */
  ngOnInit() {
    this.assetService.currentAssetSubject.subscribe((asset: AssetInformation) => {
      if (this.isCurrentAssetView(asset)) {
        this.averageCostFormControl.setValue(asset.averageCost ? asset.averageCost : 0);
        this.budgetFormControl.setValue(asset.budget ? asset.budget : 0);
        this.currencyFormControl.setValue(asset.currency ? asset.currency : Currency.USD);
        this.sharesFormControl.setValue(asset.shares ? asset.shares : 0);
      }
    });
  }

  /**
   * Handles form value logic when user leaves the page
   */
  ionViewWillLeave() {
    const asset: AssetInformation = this.assetService.currentAssetSubject.getValue();
    this.averageCostFormControl.setValue(asset.averageCost ? asset.averageCost : 0);
    this.budgetFormControl.setValue(asset.budget ? asset.budget : 0);
    this.currencyFormControl.setValue(asset.currency ? asset.currency : Currency.USD);
    this.sharesFormControl.setValue(asset.shares ? asset.shares : 0);
    this.formGroup.markAsPristine();
  }

  /**
   * Saves the asset configuration values based on the form control values
   */
  saveConfiguration() {
    this.assetService.updateAssetInformation({
      averageCost: Number(this.averageCostFormControl.value),
      budget: Number(this.budgetFormControl.value),
      currency: this.currencyFormControl.value ? this.currencyFormControl.value : Currency.USD,
      shares: Number(this.sharesFormControl.value),
      symbol: this.assetSymbol,
      history: this.assetService.currentAssetSubject.getValue().history
    });
    this.formGroup.markAsPristine();
    this.router.navigate(`/visualizer/${this.assetSymbol}`);
  }

  /**
   * Deletes the asset after confirming with the user
   */
  async deleteAsset() {
    let modal = await this.modalCtrl.create({
      component: AssetDeleteConfirmationModalComponent
    });
    modal.present();

    const confirmation = (await modal.onWillDismiss()).data;

    if (confirmation) {
      this.assetService.removeAsset(this.assetSymbol);
      this.router.navigate('/hub');
    }
  }

  /**
   * Determines whether the user is currently trying to view the given asset.
   * 
   * @param {AssetInformation} asset The asset information.
   * 
   * @returns {boolean} Whether the user is currently trying to view the given asset.
   */
  isCurrentAssetView(asset: AssetInformation): boolean {
    return asset.symbol === this.assetSymbol;
  }
}
