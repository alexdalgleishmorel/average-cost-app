import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ALPHA_VANTAGE_API_URL, STOCK_FUNCTION_TYPE } from 'src/constants';

@Component({
  selector: 'app-api-key-validation-modal',
  templateUrl: './api-key-validation-modal.component.html',
  styleUrls: ['./api-key-validation-modal.component.scss'],
})
export class ApiKeyValidationModalComponent implements OnInit {
  @Input() apiKeyValue: string = '';
  public validationStatus: ApiKeyValidationStatus = ApiKeyValidationStatus.IN_PROGRESS;

  constructor(private modalCtrl: ModalController, private http: HttpClient) { }

  ngOnInit() {
    let url = `${ALPHA_VANTAGE_API_URL}?function=${STOCK_FUNCTION_TYPE}&symbol=CSCO&outputsize=full&apikey=${this.apiKeyValue}`;
    this.http.get(url).subscribe({
      next: (data) => {
        if (!data.hasOwnProperty('Time Series (Daily)') && !data.hasOwnProperty('Time Series (Digital Currency Daily)')) {
          this.validationStatus = ApiKeyValidationStatus.FAILURE;
        } else {
          this.validationStatus = ApiKeyValidationStatus.SUCCESS;
        }
      },
      error: () => {
        this.validationStatus = ApiKeyValidationStatus.FAILURE;
      }
    });
  }

  exitWithSuccess() {
    this.modalCtrl.dismiss(true);
  }

  exitWithFailure() {
    this.modalCtrl.dismiss(false);
  }

  validationInProgress(): boolean {
    return this.validationStatus === ApiKeyValidationStatus.IN_PROGRESS;
  }

  validationSuccess(): boolean {
    return this.validationStatus === ApiKeyValidationStatus.SUCCESS;
  }
 }

enum ApiKeyValidationStatus {
  IN_PROGRESS = 0,
  SUCCESS = 1,
  FAILURE = 2
}
