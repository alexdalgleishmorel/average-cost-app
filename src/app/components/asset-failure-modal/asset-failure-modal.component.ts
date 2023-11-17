import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AssetInformation } from '../../services/asset/asset.service';

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

  /**
   * Determines whether the current failure occured during asset creation.
   * 
   * @returns {boolean} Whether this failure occured during asset creation.
   */
  isCreationFailure(): boolean {
    return this.failureType === AssetFailureType.CREATION;
  }

  /**
   * Determines whether the current failure occured during asset update.
   * 
   * @returns {boolean} Whether this failure occured during asset update.
   */
  isUpdateFailure(): boolean {
    return this.failureType === AssetFailureType.UPDATE;
  }

  /**
   * Closes the modal.
   */
  dismiss() {
    this.modalCtrl.dismiss();
  }
}

export enum AssetFailureType {
  CREATION = 'creation',
  UPDATE = 'update'
}
