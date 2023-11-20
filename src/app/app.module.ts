import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';

import { AccountComponent } from './components/account/account.component';
import { ChartComponent } from './components/visualizer/chart/chart.component';
import { HubComponent } from './components/hub/hub.component';
import { SettingsComponent } from './components/visualizer/settings/settings.component';
import { VisualizerComponent } from './components/visualizer/visualizer.component';
import { AssetService } from './services/asset/asset.service';
import { ReactiveFormsModule } from '@angular/forms';
import { AssetCreationModalComponent } from './components/asset-creation-modal/asset-creation-modal.component';
import { AssetFailureModalComponent } from './components/asset-failure-modal/asset-failure-modal.component';
import { AssetDeleteConfirmationModalComponent } from './components/asset-delete-confirmation-modal/asset-delete-confirmation-modal.component';
import { ApiKeyValidationModalComponent } from './components/api-key-validation-modal/api-key-validation-modal.component';
import { RouterService } from './services/router/router.service';

@NgModule({
  declarations: [
    AccountComponent,
    ApiKeyValidationModalComponent,
    AppComponent,
    AssetCreationModalComponent,
    AssetDeleteConfirmationModalComponent,
    AssetFailureModalComponent,
    ChartComponent,
    HubComponent,
    SettingsComponent,
    VisualizerComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(), 
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [
    AssetService,
    RouterService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
