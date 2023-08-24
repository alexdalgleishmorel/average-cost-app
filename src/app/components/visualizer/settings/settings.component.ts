import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService } from 'src/app/services/asset/asset.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {

  public averageCostFormControl = new FormControl(null, [Validators.required]);
  public sharesFormControl = new FormControl(null, [Validators.required]);
  public budgetFormControl = new FormControl(null, [Validators.required]);

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

  saveConfiguration() {
    this.assetService.updateCurrentAsset({
      averageCost: Number(this.averageCostFormControl.value),
      budget: Number(this.budgetFormControl.value),
      shares: Number(this.sharesFormControl.value),
      symbol: this.assetSymbol
    });
    this.formGroup.markAsPristine();
    this.router.navigate(['/', 'visualizer', this.assetSymbol]);
  }
}
