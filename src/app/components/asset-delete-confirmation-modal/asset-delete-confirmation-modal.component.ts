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

  cancel() {
    this.modalCtrl.dismiss(false);
  }

  confirm() {
    this.modalCtrl.dismiss(true);
  }
}
