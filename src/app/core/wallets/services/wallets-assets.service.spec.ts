import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WalletsAssetsService } from './wallets-assets.service';
import { CuratedAssetsStore } from '~root/state/curated-assets/curated-assets.store';
import { WalletsAssetsStore } from '~root/state';
import { parseCurrencyDetails } from '~root/state/wallets-asset.model';

describe('WalletsAssetsService', () => {
  let service: WalletsAssetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WalletsAssetsService,
        CuratedAssetsStore,
        WalletsAssetsStore,
      ]
    });
    service = TestBed.inject(WalletsAssetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse currency details and preserve image from TOML', () => {
    const details = parseCurrencyDetails({
      name: 'USD Coin',
      desc: 'USDC pegged token',
      image: 'https://example.com/usdc.png',
    });
    expect(details.name).toBe('USD Coin');
    expect(details.image).toBe('https://example.com/usdc.png');
    expect(details.notInToml).toBeFalse();
  });

  it('should handle missing currency data gracefully', () => {
    const details = parseCurrencyDetails(undefined);
    expect(details.notInToml).toBeTrue();
    expect(details.image).toBeUndefined();
  });
});