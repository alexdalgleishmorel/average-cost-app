import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AssetService, AssetType, Currency } from '../../services/asset/asset.service';
import { RouterService } from '../../services/router/router.service';

@Component({
  selector: 'app-asset-creation-modal',
  templateUrl: './asset-creation-modal.component.html',
  styleUrls: ['./asset-creation-modal.component.scss'],
})
export class AssetCreationModalComponent {

  public assetType: AssetType = AssetType.STOCK;

  public symbolFormControl = new FormControl('', [Validators.required]);
  public averageCostFormControl = new FormControl(null, [Validators.required]);
  public sharesFormControl = new FormControl(null, [Validators.required]);
  public budgetFormControl = new FormControl(null, [Validators.required]);
  public currencyFormControl = new FormControl(Currency.USD, []);

  public formGroup: FormGroup = this._formBuilder.group({
    symbolFormControl: this.symbolFormControl,
    averageCostFormControl: this.averageCostFormControl,
    currencyFormControl: this.currencyFormControl,
    sharesFormControl: this.sharesFormControl,
    budgetFormControl: this.budgetFormControl
  });

  public assetAlreadyExistsError: boolean = false;

  public currencies: string[];

  constructor(
    private _formBuilder: FormBuilder,
    private assetService: AssetService,
    private modalCtrl: ModalController,
    private router: RouterService
  ) {
    this.currencies = Object.keys(Currency);
  }

  /**
   * Intializes additional form control logic.
   */
  ngOnInit() {
    this.symbolFormControl.valueChanges.subscribe(value => {
      this.assetAlreadyExistsError = false;
      if (value && value !== value.toUpperCase()) {
        this.symbolFormControl.setValue(value.toUpperCase());
      }
    });
  }

  /**
   * Dismisses the modal.
   */
  cancel() {
    this.modalCtrl.dismiss();
  }

  /**
   * Creates the asset based on the form control values.
   */
  create() {
    if (!this.symbolFormControl.value) {
      return;
    }

    try {
      this.assetService.updateAssetInformation({
        averageCost: Number(this.averageCostFormControl.value),
        budget: Number(this.budgetFormControl.value),
        currency: this.currencyFormControl.value ? this.currencyFormControl.value : Currency.USD,
        shares: Number(this.sharesFormControl.value),
        symbol: this.symbolFormControl.value,
        type: this.assetType
      });
    } catch (AssetAlreadyExistsError) {
      this.assetAlreadyExistsError = true;
      this.formGroup.markAsPristine();
      return;
    }

    let assetCreationSubscription = this.assetService.lastUpdatedAssetSubject.subscribe(asset => {
      if (asset.symbol === this.symbolFormControl.value) {
        assetCreationSubscription.unsubscribe();
        this.router.navigate(`/visualizer/${this.symbolFormControl.value}`);
        this.modalCtrl.dismiss();
      }
    });

    this.assetAlreadyExistsError = false;
    this.formGroup.markAsPristine();
  }

  /**
   * Handles when the user toggles between different asset types (i.e. STOCK, CRYPTO)
   * 
   * @param event The change event
   */
  onAssetTypeChange(event: any) {
    this.assetType = event.detail.value;
  }

  /**
   * Returns the STOCK asset type
   * 
   * @returns {AssetType} STOCK asset type
   */
  getStockAssetType(): AssetType {
    return AssetType.STOCK;
  }

  /**
   * Returns the CRYPTO asset type
   * 
   * @returns {AssetType} CRYPTO asset type
   */
  getCryptoAssetType(): AssetType {
    return AssetType.CRYPTO;
  }
}
