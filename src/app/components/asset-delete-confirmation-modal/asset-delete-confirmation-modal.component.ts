import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-asset-delete-confirmation-modal',
  templateUrl: './asset-delete-confirmation-modal.component.html',
  styleUrls: ['./asset-delete-confirmation-modal.component.scss'],
})
export class AssetDeleteConfirmationModalComponent implements OnInit {

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  /**
   * Closes the modal with a negative confirmation
   */
  cancel() {
    this.modalCtrl.dismiss(false);
  }

  /**
   * Closes the modal with a positive confirmation
   */
  confirm() {
    this.modalCtrl.dismiss(true);
  }
}
