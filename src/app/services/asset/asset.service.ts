import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map, of } from 'rxjs';
import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_API_URL, MOCK_STOCK_DATA } from 'src/constants';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  public currentAssetSubject: Subject<AssetInformation> = new Subject<AssetInformation>();

  private functionType: string = 'TIME_SERIES_DAILY';

  constructor(private http: HttpClient) {}

  getAssetPriceData(): Observable<ChartDataPoint[]> {
    // const url = `${ALPHA_VANTAGE_API_URL}?function=${this.functionType}&symbol=${this.currentSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
    // return this.http.get(url);
    
    return of(MOCK_STOCK_DATA).pipe(
      map((data: any) => {
        const formattedData: ChartDataPoint[] = [];
        data = data['Time Series (Daily)'];
        for (let date in data) {
          formattedData.push({
            date: date,
            value: Number(data[date]['4. close'])
          });
        }
        return formattedData;
      })
    );
  }

  updateCurrentAsset(asset: AssetInformation) {
    this.currentAssetSubject.next(asset);
  }

  getAllAssets(): AssetInformation[] {
    return [
      { symbol: 'RKLB' },
      { symbol: 'BTCC-B.TO' },
      { symbol: 'DDOG' },
      { symbol: 'ADSK' },
      { symbol: 'DIS' },
      { symbol: 'EBAY' },
      { symbol: 'PINS' },
      { symbol: 'SPCE' },
    ];
  }
}

export interface AssetInformation {
  averageCost?: number;
  budget?: number;
  shares?: number;
  symbol: string;
}

export interface ChartData {
  assetInformation: AssetInformation;
  dataPoints: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}
