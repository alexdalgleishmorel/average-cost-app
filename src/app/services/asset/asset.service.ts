import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import * as moment from 'moment';

import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_API_URL, STORAGE_PREFIX } from 'src/constants';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AssetFailureModalComponent, AssetFailureType } from 'src/app/components/asset-failure-modal/asset-failure-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  public currentAssetSubject: BehaviorSubject<AssetInformation> = new BehaviorSubject<AssetInformation>({ symbol: '' });
  public chartViewActive: boolean = false;
  public chartValueData: any[] = [];

  private stockFunctionType: string = 'TIME_SERIES_DAILY';
  private cryptoFunctionType: string = 'DIGITAL_CURRENCY_DAILY';

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private router: Router
  ) {}

  updateAssetInformation(updatedAsset: AssetInformation) {
    const assetStorageName: string = this.getAssetStorageName(updatedAsset.symbol);

    const storedData = localStorage.getItem(assetStorageName);

    if (!storedData) {
      throw new AssetNotFoundError();
    }

    // Retrieve the current asset information from local storage
    let asset: AssetInformation = JSON.parse(storedData);

    // Update the asset information in storage
    asset.averageCost = updatedAsset.averageCost;
    asset.budget = updatedAsset.budget;
    asset.shares = updatedAsset.shares;
    localStorage.setItem(assetStorageName, JSON.stringify(asset));

    // Check if this is the current asset subject, update the subject in this case
    if (this.currentAssetSubject.getValue().symbol === updatedAsset.symbol) {
      this.currentAssetSubject.next(asset);
    }
  }

  saveNewAsset(assetInformation: AssetInformation) {
    const assetStorageName: string = this.getAssetStorageName(assetInformation.symbol);

    // Check if the asset already exists
    if (localStorage.getItem(assetStorageName)) {
      throw new AssetAlreadyExistsError();
    }

    // Save the asset information
    localStorage.setItem(assetStorageName, JSON.stringify(assetInformation));
  }

  switchAssets(assetSymbol: string) {
    if (!assetSymbol) {
      this.currentAssetSubject.next({ symbol: '' });
      return;
    }

    const assetStorageName: string = this.getAssetStorageName(assetSymbol);

    const storedData = localStorage.getItem(assetStorageName);

    if (!storedData) {
      throw new AssetNotFoundError();
    }

    // Retrieve the asset information from local storage
    let asset: AssetInformation = JSON.parse(storedData);

    // Update the price history if it's outdated, saving the new history as well
    if (!asset.history || asset.history.lastUpdated !== moment().format('YYYY-MM-DD')) {
      this.getAssetPriceData(asset).subscribe(async (data: ChartData) => {
        if (data.dataPoints.length) {
          asset.history = data;
          localStorage.setItem(assetStorageName, JSON.stringify(asset));
        } else {

          let modal = await this.modalCtrl.create({
            component: AssetFailureModalComponent,
            componentProps: {
              failureType: !asset.history ? AssetFailureType.CREATION : AssetFailureType.UPDATE,
              asset: asset,
              lastUpdated: data.lastUpdated
            }
          });
          modal.present();

          if (!asset.history) {
            // If no history already exists for this asset, then we've failed to create it
            this.removeAsset(asset.symbol);

            this.router.navigate(['/', 'hub']);
            return;
          }
        }
        this.currentAssetSubject.next(asset);
      });
    } else {
      // Set the currentAssetSubject to this asset
      this.currentAssetSubject.next(asset);
    }
  }

  getAllAssets(): AssetInformation[] {
    let assets: AssetInformation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {

        const storedData = localStorage.getItem(key);

        if (!storedData) {
          throw new AssetNotFoundError();
        }

        assets.push(JSON.parse(storedData));

      }
    }
    return assets;
  }

  removeAsset(assetSymbol: string) {
    const assetStorageName: string = this.getAssetStorageName(assetSymbol);

    const storedData = localStorage.getItem(assetStorageName);

    if (!storedData) {
      throw new AssetNotFoundError();
    }

    localStorage.removeItem(assetStorageName);
  }

  private getAssetPriceData(asset: AssetInformation): Observable<ChartData> {
    let url = `${ALPHA_VANTAGE_API_URL}?function=${this.stockFunctionType}&symbol=${asset.symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;

    if (asset.type === AssetType.CRYPTO) {
      url = `${ALPHA_VANTAGE_API_URL}?function=${this.cryptoFunctionType}&symbol=${asset.symbol}&market=USD&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    return this.http.get(url).pipe(
      map((data: any) => {
        if (!data.hasOwnProperty('Time Series (Daily)') && !data.hasOwnProperty('Time Series (Digital Currency Daily)')) {
          return {
            dataPoints: [],
            lastUpdated: moment().format('YYYY-MM-DD')
          };
        }

        const formattedData: ChartDataPoint[] = [];
        const timeSeries = asset.type === AssetType.CRYPTO ? data['Time Series (Digital Currency Daily)'] : data['Time Series (Daily)'];
        
        for (let date in timeSeries) {
          formattedData.push({
            date: date,
            value: asset.type === AssetType.CRYPTO ? Number(timeSeries[date]['4a. close (USD)']) : Number(timeSeries[date]['4. close'])
          });
        }
        return {
          dataPoints: formattedData.reverse(),
          lastUpdated: moment().format('YYYY-MM-DD')
        };
      }),
      catchError(() => {
        return of({
          dataPoints: [],
          lastUpdated: moment().format('YYYY-MM-DD')
        });
      })
    );
  }

  private getAssetStorageName(assetSymbol: string): string {
    return STORAGE_PREFIX + '/' + assetSymbol;
  }
}

export interface AssetInformation {
  averageCost?: number;
  budget?: number;
  calculatedAverageCost?: number;
  history?: ChartData;
  shares?: number;
  symbol: string;
  type?: AssetType;
}

export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK'
}

export interface ChartData {
  dataPoints: ChartDataPoint[];
  lastUpdated: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export class AssetAlreadyExistsError extends Error {
  constructor() {
    super();
    this.message = 'Asset already exists in local storage'
  }
}

export class AssetNotFoundError extends Error {
  constructor() {
    super();
    this.message = 'Asset not found in local storage'
  }
}
