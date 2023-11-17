import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ALPHA_VANTAGE_API_URL, STOCK_FUNCTION_TYPE } from '../../../constants';

@Component({
  selector: 'app-api-key-validation-modal',
  templateUrl: './api-key-validation-modal.component.html',
  styleUrls: ['./api-key-validation-modal.component.scss'],
})
export class ApiKeyValidationModalComponent implements OnInit {
  @Input() apiKeyValue: string = '';
  public validationStatus: ApiKeyValidationStatus = ApiKeyValidationStatus.IN_PROGRESS;

  constructor(private modalCtrl: ModalController, private http: HttpClient) {}

  /**
   * Immediately begins api key validation on component intializing. Sets the validation status flag upon completion.
   */
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

  /**
   * Dismisses the modal after a successful validation.
   */
  exitWithSuccess() {
    this.modalCtrl.dismiss(true);
  }

  /**
   * Dismisses the modal after a failed validation.
   */
  exitWithFailure() {
    this.modalCtrl.dismiss(false);
  }

  /**
   * Determines whether the api key validation is still in progress
   * 
   * @returns {boolean} Whether the validation is still in progress
   */
  validationInProgress(): boolean {
    return this.validationStatus === ApiKeyValidationStatus.IN_PROGRESS;
  }

  /**
   * Determines whether the api key validation is complete and successful
   * 
   * @returns {boolean} Whether the validation is complete and was successful
   */
  validationSuccess(): boolean {
    return this.validationStatus === ApiKeyValidationStatus.SUCCESS;
  }
 }

enum ApiKeyValidationStatus {
  IN_PROGRESS = 0,
  SUCCESS = 1,
  FAILURE = 2
}
