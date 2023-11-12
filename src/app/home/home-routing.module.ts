import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';

import { ChartComponent } from '../components/visualizer/chart/chart.component';
import { HubComponent } from '../components/hub/hub.component';
import { SettingsComponent } from '../components/visualizer/settings/settings.component';
import { VisualizerComponent } from '../components/visualizer/visualizer.component';
import { AccountComponent } from '../components/account/account.component';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: '',
        redirectTo: 'hub',
        pathMatch: 'full'
      },
      {
        path: 'hub',
        component: HubComponent,
        children: []
      },
      {
        path: 'settings',
        component: AccountComponent
      },
      {
        path: 'visualizer/:symbol',
        component: VisualizerComponent,
        children: [
          {
            path: '',
            redirectTo: 'chart',
            pathMatch: 'full'
          },
          {
            path: 'chart',
            component: ChartComponent
          },
          {
            path: 'configuration',
            component: SettingsComponent
          }
        ]
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
