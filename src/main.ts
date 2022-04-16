import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableAkitaProdMode } from '@datorama/akita';

import { AppModule } from './app/app.module';
import { environment } from '~env';

import { storageProviders } from './storage';

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
}

platformBrowserDynamic(storageProviders)
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
