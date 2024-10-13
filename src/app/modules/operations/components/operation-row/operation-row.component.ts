import { Component, Input } from '@angular/core';
import { IOperationRecord } from '~root/modules/operations/pages/operations-dashboard/operations-dashboard.component';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';

@Component({
  selector: 'app-operation-row',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    AsyncPipe,
    SharedPipesModule
  ],
  template: `
    @if (_operation$ | async; as operation) {
      <section class="w-full flex px-4 cursor-pointer">
        <div class="w-7/12">
          @if (asset$ | async; as asset) {
            <p class="text-base font-semibold m-0">
              {{ asset.code }}
            </p>
            <p class="text-xs opacity-80 m-0">
              {{ asset.issuer === 'native' ? asset.issuer : (asset.issuer | publicKey) }}
            </p>
          }
        </div>

        <div class="w-5/12 flex flex-col justify-center items-end">
          <p
            [class.text-success]="operation.recordType === 'account_created' || operation.recordType === 'account_credited'"
            [class.text-error]="operation.recordType === 'account_debited'"
            class="m-0 text-base truncate">
            @if (operation.debit > 0) {
              {{ operation.debit | number: '0.0-7' }}
            } @else {
              {{ operation.credit | number: '0.0-7' }}
            }
          </p>
          <p class="text-xs opacity-80 m-0">
            {{ operation.date | date: 'MMM dd, yyyy' }}
          </p>
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      width: 100%;
      display: block;
    }
  `
})
export class OperationRowComponent {
  _operation$: BehaviorSubject<IOperationRecord | undefined> = new BehaviorSubject<IOperationRecord | undefined>(undefined);
  @Input() set operation(data: IOperationRecord) {
    this._operation$.next(data ? data : undefined);
  }

  asset$: Observable<{ code: string; issuer: string; }> = this._operation$.asObservable()
    .pipe(
      filter(Boolean),
      map(operation => {
        return operation.asset === 'native'
          ? ({ code: 'XLM', issuer: 'native' })
          : ({ code: operation.asset.split(':')[0], issuer: operation.asset.split(':')[1] });
      })
    )
}
