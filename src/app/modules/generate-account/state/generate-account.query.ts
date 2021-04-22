import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { GenerateAccountStore, GenerateAccountState } from './generate-account.store';

@Injectable()
export class GenerateAccountQuery extends Query<GenerateAccountState> {

  constructor(protected store: GenerateAccountStore) {
    super(store);
  }

}
