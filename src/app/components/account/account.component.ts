import { Component, OnInit } from '@angular/core';
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
export class AccountComponent implements OnInit {
  public apiKeyFormControl = new FormControl('');
  public darkModeFormControl;

  constructor(private assetService: AssetService, private modalCtrl: ModalController) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.darkModeFormControl = new FormControl(prefersDark);
    this.darkModeFormControl.valueChanges.subscribe(prefersDark => {
      toggleDarkTheme(!!prefersDark);
    });
  }

  ngOnInit() {
    this.apiKeyFormControl.setValue(this.assetService.getApiKey());
  }

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

  isApiKeyFormEnabled(): boolean {
    return this.apiKeyFormControl.dirty && !!this.apiKeyFormControl.getRawValue();
  }
}
