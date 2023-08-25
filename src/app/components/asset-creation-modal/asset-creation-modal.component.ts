import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AssetService, AssetType } from 'src/app/services/asset/asset.service';

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

  public formGroup: FormGroup = this._formBuilder.group({
    symbolFormControl: this.symbolFormControl,
    averageCostFormControl: this.averageCostFormControl,
    sharesFormControl: this.sharesFormControl,
    budgetFormControl: this.budgetFormControl
  });

  public assetAlreadyExistsError: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private assetService: AssetService,
    private modalCtrl: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
    this.symbolFormControl.valueChanges.subscribe(value => {
      this.assetAlreadyExistsError = false;
      if (value && value !== value.toUpperCase()) {
        this.symbolFormControl.setValue(value?.toUpperCase());
      }
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  create() {
    if (!this.symbolFormControl.value) {
      return;
    }

    try {
      this.assetService.saveNewAsset({
        averageCost: Number(this.averageCostFormControl.value),
        budget: Number(this.budgetFormControl.value),
        shares: Number(this.sharesFormControl.value),
        symbol: this.symbolFormControl.value,
        type: this.assetType
      });
    } catch (AssetAlreadyExistsError) {
      this.assetAlreadyExistsError = true;
      this.formGroup.markAsPristine();
      return;
    }

    this.assetAlreadyExistsError = false;

    this.formGroup.markAsPristine();
    this.router.navigate(['/', 'visualizer', this.symbolFormControl.value]);
    this.modalCtrl.dismiss();
  }

  onAssetTypeChange(event: any) {
    this.assetType = event.detail.value;
  }

  getStockAssetType(): AssetType {
    return AssetType.STOCK;
  }

  getCryptoAssetType(): AssetType {
    return AssetType.CRYPTO;
  }
}
