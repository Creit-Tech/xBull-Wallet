import { Component, OnInit } from '@angular/core';
import { snapshotManager } from '@datorama/akita';
import { saveAs } from 'file-saver';
import { secretbox, randomBytes, box } from 'tweetnacl';
import { decodeUTF8, encodeBase64 } from 'tweetnacl-util';


@Component({
  selector: 'app-export-wallet',
  templateUrl: './export-wallet.component.html',
  styleUrls: ['./export-wallet.component.scss']
})
export class ExportWalletComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  exportData(): void {
    const keypair = box.keyPair();
    const nonce = randomBytes(24);
    const encryptedSnapshot = secretbox(
      decodeUTF8(JSON.stringify(snapshotManager.getStoresSnapshot())),
      nonce,
      keypair.secretKey,
    );

    const backupFileData = {
      index: encodeBase64(keypair.publicKey),
      nonce: encodeBase64(nonce),
      snapshot: encodeBase64(encryptedSnapshot),
    };

    const backup = { type: 'backup', data: backupFileData };
    const file = new Blob([JSON.stringify(backup)], { type: 'text/plain;charset=utf-8' });
    saveAs(file, 'backup.json');


    const keyFileData = { type: 'key', data: encodeBase64(keypair.secretKey) };
    const file2 = new Blob([JSON.stringify(keyFileData)], { type: 'text/plain;charset=utf-8' });
    saveAs(file2, 'key.json');
  }

}
