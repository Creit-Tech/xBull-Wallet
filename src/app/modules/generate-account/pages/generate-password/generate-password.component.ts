import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { GenerateAccountQuery, GenerateAccountService } from '~root/modules/generate-account/state';
import { ActivatedRoute, Router } from '@angular/router';
import { ENV, environment } from '~env';
import { take } from 'rxjs/operators';
import { WalletsQuery } from '~root/state';

@Component({
  selector: 'app-generate-password',
  templateUrl: './generate-password.component.html',
  styleUrls: ['./generate-password.component.scss']
})
export class GeneratePasswordComponent implements OnInit {
  passwordFormControl: UntypedFormControl = new UntypedFormControl('', [Validators.required, Validators.minLength(8)]);

  walletVersion = this.env.version;

  pathType$ = this.generateAccountQuery.pathType$;

  globalPasswordHash$ = this.walletsQuery.globalPasswordHash$;

  constructor(
    private readonly generateAccountService: GenerateAccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    @Inject(ENV) private readonly env: typeof environment,
    private readonly generateAccountQuery: GenerateAccountQuery,
    private readonly walletsQuery: WalletsQuery,
  ) { }

  ngOnInit(): void {
    this.globalPasswordHash$
      .pipe(take(1))
      .subscribe(passwordHash => {
        if (!!passwordHash) {
          this.nextStep()
            .then();
        }
      });
  }

  async onContinue(): Promise<void> {
    if (this.passwordFormControl.invalid) {
      return;
    }

    this.generateAccountService.savePassword(this.passwordFormControl.value);

    await this.nextStep();
  }

  async nextStep(): Promise<void> {
    const pathType = await this.pathType$
      .pipe(take(1))
      .toPromise();

    switch (pathType) {
      case 'new_wallet':
      case 'restore_wallet':
        this.router.navigate(['confirm-phrase-password'], {
          relativeTo: this.route.parent,
        }).then();
        break;

      case 'import_secret_key':
        this.router.navigate(['confirm-secret-password'], {
          relativeTo: this.route.parent,
        }).then();
        break;
    }
  }

}
