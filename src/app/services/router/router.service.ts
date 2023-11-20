import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouterService {

  private isAppSubmodule: boolean = false;

  constructor(private router: Router) {}

  navigate(route: string) {
    this.router.navigate([(this.isAppSubmodule ? 'average-cost' : '').concat(route)]);
  }
}
