import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  host: {'average-cost': 'true'},
})
export class AppComponent {
  constructor() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    toggleDarkTheme(prefersDark);
  }
}

export function toggleDarkTheme(enable: boolean) {
  document.body.classList.toggle('dark', enable);
}
