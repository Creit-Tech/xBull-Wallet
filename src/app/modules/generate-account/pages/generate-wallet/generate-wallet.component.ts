import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GenerateAccountService } from '~root/modules/generate-account/state';

@Component({
  selector: 'app-generate-wallet',
  templateUrl: './generate-wallet.component.html',
  styleUrls: ['./generate-wallet.component.scss']
})
export class GenerateWalletComponent implements OnInit {
  mnemonicPhraseFormControl: FormControlTyped<string> = new FormControl('', [Validators.required]);

  constructor(
    private readonly mnemonicPhraseService: MnemonicPhraseService,
    private readonly generateAccountService: GenerateAccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
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
