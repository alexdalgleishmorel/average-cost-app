import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, catchError, map, of } from 'rxjs';
import * as moment from 'moment';

import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_API_URL, CRYPTO_FUNCTION_TYPE, STOCK_FUNCTION_TYPE, STORAGE_PREFIX } from 'src/constants';
import { ModalController } from '@ionic/angular';
import { AssetFailureModalComponent, AssetFailureType } from 'src/app/components/asset-failure-modal/asset-failure-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  public chartValueData: any[] = [];
  public chartViewActive: boolean = false;
  public currentAssetSubject: BehaviorSubject<AssetInformation> = new BehaviorSubject<AssetInformation>({ symbol: '' });
  public lastUpdatedAssetSubject: Subject<AssetInformation> = new Subject<AssetInformation>();
  public networthMetaDataSubject: BehaviorSubject<NetworthMetaData> = new BehaviorSubject<NetworthMetaData>({ bookValue: 0, marketValue: 0} );

  private assetsUpdated: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private modalCtrl: ModalController, private http: HttpClient) {
    let totalAssets = this.getAllAssets();
    totalAssets.forEach(asset => {
      this.updateAssetInformation(asset);
    });
    this.assetsUpdated.subscribe(assetsUpdated => {
      if (assetsUpdated === totalAssets.length) {
        this.updateNetworthInformation();
      }
    });
  }

  /**
   * Updates an asset's information with the provided data. 
   * Retrieves the latest price information before saving.
   * Creates the asset if it deosn't exist.
   * 
   * @param {AssetInformation} asset The asset information.
   */
  updateAssetInformation(asset: AssetInformation) {
    const assetStorageName: string = this.getAssetStorageName(asset.symbol);

    // Get the latest price history of the asset
    this.updatePriceHistory(asset).subscribe(async (data: ChartData) => {
      if (data.dataPoints.length) {
        asset.history = data;
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
        return;
      }
      // Update the asset information in storage
      localStorage.setItem(assetStorageName, JSON.stringify(asset));

      // Notify app about the update
      this.lastUpdatedAssetSubject.next(asset);
      this.assetsUpdated.next(this.assetsUpdated.getValue()+1);

      // Update networth data based on this update
      this.updateNetworthInformation();

      // Check if this is the current asset subject, update the subject in this case
      if (this.currentAssetSubject.getValue().symbol === asset.symbol) {
        this.currentAssetSubject.next(asset);
      }
    });
  }

  /**
   * Takes an asset symbol, retrieves its latest data and sets it as the current asset being viewed.
   * 
   * @param {string} assetSymbol The symbol of the asset.
   */
  switchAssets(assetSymbol: string) {
    if (!assetSymbol) {
      // This is used to ensure that previous used charts are torn down
      this.currentAssetSubject.next({ symbol: '' });
      return;
    }

    // Subscribe to the successful update of the asset data, at which point the currentAssetSubject can be updated
    let asset = this.getAsset(assetSymbol);
    let assetCreationSubscription = this.lastUpdatedAssetSubject.subscribe(asset => {
      if (asset.symbol === assetSymbol) {
        assetCreationSubscription.unsubscribe();
        this.currentAssetSubject.next(asset);
      }
    });

    // Performs an update on the asset
    this.updateAssetInformation(asset);
  }

  /**
   * Retrieves an asset from storage based on its symbol.
   * 
   * @param {string} assetSymbol The asset symbol.
   * 
   * @returns {AssetInformation} The asset information.
   */
  getAsset(assetSymbol: string): AssetInformation {
    if (!assetSymbol) {
      this.currentAssetSubject.next({ symbol: '' });
      throw new AssetNotFoundError();
    }

    const assetStorageName: string = this.getAssetStorageName(assetSymbol);

    const storedData = localStorage.getItem(assetStorageName);

    if (!storedData) {
      throw new AssetNotFoundError();
    }

    // Retrieve the asset information from local storage
    return JSON.parse(storedData);
  }

  /**
   * Retrieves each individual asset that the user owns.
   * 
   * @returns {AssetInformation[]} A list of assetInformation objects.
   */
  getAllAssets(): AssetInformation[] {
    let assets: AssetInformation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {

        const storedData = localStorage.getItem(key);

        if (!storedData) {
          throw new AssetNotFoundError();
        }

        const asset: AssetInformation = JSON.parse(storedData);

        if (asset.symbol === 'CADUSD' || asset.symbol === 'NETWORTH') {
          continue;
        }

        assets.push(asset);
      }
    }
    return assets;
  }

  /**
   * Removes an asset from storage based on its symbol.
   * 
   * @param {string} assetSymbol Removes an asset from storage based on its symbol.
   */
  removeAsset(assetSymbol: string) {
    const assetStorageName: string = this.getAssetStorageName(assetSymbol);

    const storedData = localStorage.getItem(assetStorageName);

    if (storedData) { 
      localStorage.removeItem(assetStorageName); 
    }

    // Update networth data based on this update
    this.updateNetworthInformation();
  }

  /**
   * Retrieves the price history of an asset, using Alpha Vantage STOCK API.
   * 
   * @param {AssetInformation} asset The asset information.
   * 
   * @returns {Observable<CharData>} An observable containing the ChartData.
   */
  private getAssetPriceData(asset: AssetInformation): Observable<ChartData> {
    let url = `${ALPHA_VANTAGE_API_URL}?function=${STOCK_FUNCTION_TYPE}&symbol=${asset.symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;

    if (asset.type === AssetType.CRYPTO) {
      url = `${ALPHA_VANTAGE_API_URL}?function=${CRYPTO_FUNCTION_TYPE}&symbol=${asset.symbol}&market=USD&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
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

  /**
   * Determines the market value history of all combined assets, for each day where all assets have available market data.
   */
  private updateNetworthInformation() {
    // Retrieve the CADUSD conversion history
    const assetStorageName: string = this.getAssetStorageName('CADUSD');
    let asset: AssetInformation = { symbol: 'CADUSD' };
    const storedData = localStorage.getItem(assetStorageName);

    if (!storedData || JSON.parse(storedData).history.lastUpdated !== moment().format('YYYY-MM-DD')) {
      this.getAssetPriceData(asset).subscribe((data: ChartData) => {
        asset.history = data;
        this.saveNonUserAsset(asset);
        this.computeNetworth(asset.history.dataPoints.length ? asset.history.dataPoints : []);
      });
    } else {
      const asset: AssetInformation = JSON.parse(storedData);
      this.computeNetworth(asset.history?.dataPoints.length ? asset.history.dataPoints : []);
    }
  }

  /**
   * Computes the book and market value of the user's networth, based on all the assets the user owns
   * 
   * @param {ChartDataPoint[]} cadUsdConversionHistory The cad-usd conversion history, used to convert from one currency to another
   */
  private computeNetworth(cadUsdConversionHistory: ChartDataPoint[]) {
    let assets: AssetInformation[] = this.getAllAssets();

    if (!cadUsdConversionHistory.length) {
      return;
    }
    if (!assets.length) {
      this.removeNonUserAsset('NETWORTH');
      this.networthMetaDataSubject.next({ bookValue: 0, marketValue: 0 });
      return;
    }

    const cadUsdConversion: number = cadUsdConversionHistory[cadUsdConversionHistory.length-1].value;

    let bookValue: number = 0;
    let marketValueHistoryDict: { [date: string]: number } = {};
    let marketValuePriceLookup: { [date: string]: number } = {};
    let marketValueHistory: ChartDataPoint[] = [];

    // Finds common dates between all assets, sums the total market values for all dates and determines networth book value.
    assets.forEach(asset => {
      if (asset.shares && asset.averageCost && asset.history?.dataPoints.length) {
        asset.history.dataPoints.forEach(dataPoint => {
          if (marketValueHistoryDict[dataPoint.date]) {
            marketValueHistoryDict[dataPoint.date] += 1;
          } else {
            marketValueHistoryDict[dataPoint.date] = 1;
          }
          if (asset.shares) {
            if (marketValuePriceLookup[dataPoint.date]) {
              marketValuePriceLookup[dataPoint.date] += asset.currency === Currency.USD ? asset.shares * dataPoint.value : (asset.shares * dataPoint.value)*(1/cadUsdConversion);
            } else {
              marketValuePriceLookup[dataPoint.date] = asset.currency === Currency.USD ? asset.shares * dataPoint.value : (asset.shares * dataPoint.value)*(1/cadUsdConversion);
            }
          }
        });
        bookValue += asset.currency === Currency.USD ? asset.shares * asset.averageCost : (asset.shares * asset.averageCost)*(1/cadUsdConversion);
      }
    });

    // Creates chart data representing the total market price of all assets for the dates in which market data is available for all assets
    for (let date in marketValueHistoryDict) {
      if (marketValueHistoryDict[date] === assets.length) {
        marketValueHistory.push({
          date: date,
          value: marketValuePriceLookup[date]
        });
      }
    }

    // Updates the networth meta data
    this.networthMetaDataSubject.next({
      bookValue: bookValue,
      marketValue: marketValuePriceLookup[marketValueHistory[marketValueHistory.length-1].date],
    });

    // Update the networth information in storage
    this.saveNonUserAsset({
      symbol: 'NETWORTH',
      calculatedAverageCost: marketValueHistory[marketValueHistory.length-1].value,
      budget: bookValue,
      history: {
        dataPoints: marketValueHistory,
        lastUpdated: moment().format('YYYY-MM-DD')
      }
    });
  }

  /**
   * Takes a symbol and appends a storage prefix to the beginning to access asset data.
   * 
   * @param {string} assetSymbol The asset symbol
   *  
   * @returns {string} Key to access the asset information from storage
   */
  private getAssetStorageName(assetSymbol: string): string {
    return STORAGE_PREFIX + '/' + assetSymbol;
  }

  /**
   * Retrieves the latest price history for the given asset.
   * 
   * @param {AssetInformation} asset The asset information.
   *  
   * @returns {Observable<ChartData>} The latest chart data for the given asset.
   */
  private updatePriceHistory(asset: AssetInformation): Observable<ChartData> {
    if (!asset.history || asset.history.lastUpdated !== moment().format('YYYY-MM-DD')) {
      return this.getAssetPriceData(asset);
    } else {
      return of(asset.history);
    }
  }

  /**
   * Saves assets to storage that are independent from the user.
   * 
   * @param {AssetInformation} information The asset information.
   */
  private saveNonUserAsset(information: AssetInformation) {
    const assetStorageName: string = this.getAssetStorageName(information.symbol);
    localStorage.setItem(assetStorageName, JSON.stringify(information));
  }

  /**
   * Removes an asset that is independent from the user, based on its name.
   * 
   * @param {string} name The name of the asset 
   */
  private removeNonUserAsset(name: string) {
    const assetStorageName: string = this.getAssetStorageName(name);
    const storedData = localStorage.getItem(assetStorageName);
    if (storedData) { 
      localStorage.removeItem(assetStorageName); 
    }
  }
}

export interface NetworthMetaData {
  bookValue: number;
  marketValue: number;
}

export interface AssetInformation {
  averageCost?: number;
  budget?: number;
  calculatedAverageCost?: number;
  currency?: Currency;
  history?: ChartData;
  shares?: number;
  symbol: string;
  type?: AssetType;
}

export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK'
}

export enum Currency {
  CAD = 'CAD',
  USD = 'USD'
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
