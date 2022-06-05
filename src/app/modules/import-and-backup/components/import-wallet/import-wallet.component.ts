import { Component, OnInit } from '@angular/core';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { NzMessageService } from 'ng-zorro-antd/message';
import { secretbox, box } from 'tweetnacl';
import { decodeBase64, encodeUTF8 } from 'tweetnacl-util';
import { NzModalService } from 'ng-zorro-antd/modal';
import { snapshotManager } from '@datorama/akita';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-import-wallet',
  templateUrl: './import-wallet.component.html',
  styleUrls: ['./import-wallet.component.scss']
})
export class ImportWalletComponent implements OnInit {
  public files: NgxFileDropEntry[] = [];

  keyFileData?: string;
  backupFileData?: { index: string, nonce: string, snapshot: string };

  constructor(
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
    private readonly router: Router,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  async fileLoaded(type: 'key' | 'backup', files: NgxFileDropEntry[]): Promise<void> {
    for (const droppedFile of files) {
      if (!droppedFile.fileEntry.isFile) {
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.ONLY_FILES'));
        return;
      }

      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;

      let file: File;
      try {
        file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
      } catch (e) {
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.ERROR_LOADING_FILES'));
        return;
      }

      let jsonData: { type: 'key' | 'backup', data: any };
      try {
        const fileData = await file.text();
        jsonData = JSON.parse(fileData);
      } catch (e) {
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_PARSE_INCORRECT_FILE'), {
          nzDuration: 3000
        });
        return;
      }

      if (jsonData.type !== type) {
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.MAKE_SURE_FILE_TYPE', { type }), {
          nzDuration: 5000
        });
        return;
      }

      if (jsonData.type === 'key') {
        this.keyFileData = jsonData.data;
      } else {
        this.backupFileData = jsonData.data;
      }
    }
  }

  askImportConfirm(): void {
    this.nzModalService.confirm({
      nzTitle: this.translateService.instant('HARD_CONFIRM.YOU_SURE'),
      nzContent: this.translateService.instant('IMPORT_BACKUP.IMPORTING_MESSAGE'),
      nzOnOk: this.import.bind(this)
    });
  }

  async import(): Promise<void> {
    if (!this.keyFileData || !this.backupFileData) {
      return;
    }

    const keypair = box.keyPair.fromSecretKey(decodeBase64(this.keyFileData));

    const openedBox = secretbox.open(
      decodeBase64(this.backupFileData.snapshot),
      decodeBase64(this.backupFileData.nonce),
      keypair.secretKey,
    );

    if (!openedBox) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_DECRYPT_BACKUP_FILE'));
      return;
    }

    const snapshotData = JSON.parse(encodeUTF8(openedBox));

    snapshotManager.setStoresSnapshot(snapshotData);
    snapshotManager.setStoresSnapshot(snapshotData, { lazy: true });

    this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.BACKUP_IMPORTED'), {
      nzDuration: 3000,
    });

    setTimeout(() => {
      this.router.navigate(['/']);
    }, 3000);
  }

}
