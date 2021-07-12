import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IHorizonApi } from '~root/state';
import { ReplaySubject } from 'rxjs';
import { pluck, take } from 'rxjs/operators';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';

@Component({
  selector: 'app-horizon-api-details',
  templateUrl: './horizon-api-details.component.html',
  styleUrls: ['./horizon-api-details.component.scss']
})
export class HorizonApiDetailsComponent implements OnInit, AfterViewInit {
  horizonApi$: ReplaySubject<IHorizonApi> = new ReplaySubject<IHorizonApi>();
  @Input() set horizonApi(data: IHorizonApi) {
    this.horizonApi$.next(data);
  }

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

  constructor(
    private readonly horizonApisService: HorizonApisService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  async onRemove(): Promise<void> {
    const horizonApiId = await this.horizonApi$
      .asObservable()
      .pipe(take(1))
      .pipe(pluck('_id'))
      .toPromise();

    this.horizonApisService.removeHorizonApi(horizonApiId);
    this.close.emit();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
