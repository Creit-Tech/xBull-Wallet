import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GenerateAccountService } from '~root/modules/generate-account/state';
import { ENV, environment } from '~env';

@Component({
  selector: 'app-generate-wallet',
  templateUrl: './generate-wallet.component.html',
  styleUrls: ['./generate-wallet.component.scss']
})
export class GenerateWalletComponent implements OnInit {
  mnemonicPhraseFormControl: FormControlTyped<string> = new FormControl('', [Validators.required]);

  walletVersion = this.env.version;

  constructor(
    private readonly mnemonicPhraseService: MnemonicPhraseService,
    private readonly generateAccountService: GenerateAccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    @Inject(ENV) private readonly env: typeof environment,
  ) { }

  ngOnInit(): void {
    this.mnemonicPhraseFormControl.patchValue(this.mnemonicPhraseService.generateMnemonicPhrase());
  }

  onContinue(): void {
    if (this.mnemonicPhraseFormControl.invalid) {
      return;
    }


    this.generateAccountService.saveMnemonicPhrase(this.mnemonicPhraseFormControl.value);
    this.router.navigate(['generate-password'], {
      relativeTo: this.route.parent,
    }).then();
  }

}
