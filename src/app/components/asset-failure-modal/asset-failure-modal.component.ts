import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AssetInformation, AssetType } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-asset-failure-modal',
  templateUrl: './asset-failure-modal.component.html',
  styleUrls: ['./asset-failure-modal.component.scss'],
})
export class AssetFailureModalComponent implements OnInit {
  @Input() failureType: AssetFailureType = AssetFailureType.UPDATE;
  @Input() asset: AssetInformation = { symbol: '' };
  @Input() lastUpdated: string = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  isCreationFailure(): boolean {
    return this.failureType === AssetFailureType.CREATION;
  }

  isUpdateFailure(): boolean {
    return this.failureType === AssetFailureType.UPDATE;
  }
 
  dismiss() {
    this.modalCtrl.dismiss();
  }
}

export enum AssetFailureType {
  CREATION = 'creation',
  UPDATE = 'update'
}
