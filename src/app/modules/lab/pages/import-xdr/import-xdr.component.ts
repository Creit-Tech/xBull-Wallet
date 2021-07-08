import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';
import { FormControl, Validators } from '@angular/forms';
import { merge, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-import-xdr',
  templateUrl: './import-xdr.component.html',
  styleUrls: ['./import-xdr.component.scss']
})
export class ImportXdrComponent implements OnInit {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signControl: FormControlTyped<string> = new FormControl('', Validators.required);
  signedControl: FormControlTyped<string> = new FormControl('', Validators.required);

  constructor(
    private readonly router: Router,
    private readonly componentCreatorService: ComponentCreatorService,
  ) { }

  ngOnInit(): void {
  }

  async onSing(): Promise<void> {
    if (this.signControl.invalid) {
      throw new Error(`We can't continue, XDR value is invalid`);
    }

    const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);
    ref.component.instance.xdr = this.signControl.value;

    ref.component.instance.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$, ref.destroyed$.asObservable())))
      .subscribe((signedXdr) => {
        this.signedControl.patchValue(signedXdr);
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.component.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$, ref.destroyed$.asObservable())))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  onBack(): void {
    this.router.navigate(['/lab']);
  }

}
