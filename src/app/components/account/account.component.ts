import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';

import { AssetService, Currency } from '../../services/asset/asset.service';
import { ApiKeyValidationModalComponent } from '../api-key-validation-modal/api-key-validation-modal.component';
import { getPrefersDark, toggleDarkTheme } from '../../app.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  public apiKeyFormControl;
  public darkModeFormControl;
  public currencyFormControl;

  public currencies: string[];

  constructor(private assetService: AssetService, private modalCtrl: ModalController) {
    // Sets up dark theme toggle logic
    this.darkModeFormControl = new FormControl(getPrefersDark());
    this.darkModeFormControl.valueChanges.subscribe(prefersDark => {
      toggleDarkTheme(!!prefersDark);
    });
    // Sets up api key input form control
    this.apiKeyFormControl = new FormControl(this.assetService.getApiKey());
    // Set up currencies
    this.currencyFormControl = new FormControl(this.assetService.getDefaultCurrency());
    this.currencies = Object.keys(Currency);
  }

  /**
   * Handles when the user leaves the settings page.
   */
  ionViewWillLeave() {
    this.apiKeyFormControl.setValue(this.assetService.getApiKey());
    this.apiKeyFormControl.markAsPristine();
  }

  /**
   * Handles the user saving an API key. Opens a modal which confirms key validity, saves the key to storage if it was valid.
   */
  async saveApiKey() {
    const apiKeyValue = this.apiKeyFormControl.getRawValue();
    this.apiKeyFormControl.setValue('');

    let modal = await this.modalCtrl.create({
      component: ApiKeyValidationModalComponent,
      componentProps: {
        apiKeyValue: apiKeyValue
      }
    });
    modal.present();

    const validKeyConfirmation = (await modal.onWillDismiss()).data;

    if (validKeyConfirmation) {
      localStorage.setItem('ALPHA_VANTAGE_API_KEY', apiKeyValue!);
      this.apiKeyFormControl.markAsPristine();
    }
  }

  /**
   * Saves a default currency to storage
   */
  saveDefaultCurrency() {
    this.assetService.saveDefaultCurrency(this.currencyFormControl.value!);
    this.currencyFormControl.markAsPristine();
  }

  /**
   * Determines whether the api key input can be saved at the given moment.
   * 
   * @returns {boolean} Whether the API key input can be saved.
   */
  canSaveApiKey(): boolean {
    return this.apiKeyFormControl.dirty && !!this.apiKeyFormControl.getRawValue();
  }

  /**
   * Determines whether the currency input can be saved at the given moment.
   * 
   * @returns {boolean} Whether the currency input can be saved.
   */
  canSaveCurrency(): boolean {
    return this.currencyFormControl.dirty && this.currencyFormControl.getRawValue() !== this.assetService.getDefaultCurrency();
  }
}
