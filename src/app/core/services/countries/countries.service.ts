import { Injectable } from '@angular/core';
import data from './data';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {

  constructor() { }

  getCountriesValue() {
    return data;
  }
}
