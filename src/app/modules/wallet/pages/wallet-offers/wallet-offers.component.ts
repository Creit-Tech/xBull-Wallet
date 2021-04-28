import { Component, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { OfferDetailsComponent } from '~root/modules/wallet/components/offer-details/offer-details.component';

@Component({
  selector: 'app-wallet-offers',
  templateUrl: './wallet-offers.component.html',
  styleUrls: ['./wallet-offers.component.scss']
})
export class WalletOffersComponent implements OnInit {

  constructor(
    private readonly modalsService: ModalsService,
  ) { }

  ngOnInit(): void {

  }

  onOfferSelected() {
    this.modalsService.open({ component: OfferDetailsComponent, });
  }

}
