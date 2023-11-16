import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';

import { AssetService } from 'src/app/services/asset/asset.service';
import { ApiKeyValidationModalComponent } from '../api-key-validation-modal/api-key-validation-modal.component';
import { toggleDarkTheme } from 'src/app/app.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  public apiKeyFormControl;
  public darkModeFormControl;

  constructor(private assetService: AssetService, private modalCtrl: ModalController) {
    // Sets up dark theme toggle logic
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.darkModeFormControl = new FormControl(prefersDark);
    this.darkModeFormControl.valueChanges.subscribe(prefersDark => {
      toggleDarkTheme(!!prefersDark);
    });
    // Sets up api key input form control
    this.apiKeyFormControl = new FormControl(this.assetService.getApiKey());
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
   * Determines whether the api key input can be saved at the given moment.
   * 
   * @returns {boolean} Whether the API key input can be saved.
   */
  canSaveApiKey(): boolean {
    return this.apiKeyFormControl.dirty && !!this.apiKeyFormControl.getRawValue();
  }
}
