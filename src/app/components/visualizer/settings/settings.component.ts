import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetInformation, AssetService } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {

  public averageCostFormControl = new FormControl(0, [Validators.required]);
  public sharesFormControl = new FormControl(0, [Validators.required]);
  public budgetFormControl = new FormControl(0, [Validators.required]);

  public formGroup: FormGroup = this._formBuilder.group({
    averageCostFormControl: this.averageCostFormControl,
    sharesFormControl: this.sharesFormControl,
    budgetFormControl: this.budgetFormControl
  });

  public assetSymbol: string;

  constructor(
    private _formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private assetService: AssetService,
    private router: Router
  ) {
    this.assetSymbol = this.activatedRoute.snapshot.parent?.paramMap.get('symbol')!;
  }

  ngOnInit() {
    this.assetService.currentAssetSubject.subscribe((asset: AssetInformation) => {
      if (this.isCurrentAssetView(asset)) {
        this.averageCostFormControl.setValue(asset.averageCost ? asset.averageCost : 0);
        this.budgetFormControl.setValue(asset.budget ? asset.budget : 0);
        this.sharesFormControl.setValue(asset.shares ? asset.shares : 0);
      }
    });
  }

  saveConfiguration() {
    this.assetService.updateAssetInformation({
      averageCost: Number(this.averageCostFormControl.value),
      budget: Number(this.budgetFormControl.value),
      shares: Number(this.sharesFormControl.value),
      symbol: this.assetSymbol
    });
    this.formGroup.markAsPristine();
    this.router.navigate(['/', 'visualizer', this.assetSymbol]);
  }

  isCurrentAssetView(asset: AssetInformation): boolean {
    return asset.symbol === this.assetSymbol;
  }
}
