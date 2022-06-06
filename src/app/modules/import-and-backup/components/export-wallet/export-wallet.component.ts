import { Component, Inject, OnInit } from '@angular/core';
import { snapshotManager } from '@datorama/akita';
import { saveAs } from 'file-saver';
import { secretbox, randomBytes, box } from 'tweetnacl';
import { decodeUTF8, encodeBase64 } from 'tweetnacl-util';
import { ENV, environment } from '~env';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';



@Component({
  selector: 'app-export-wallet',
  templateUrl: './export-wallet.component.html',
  styleUrls: ['./export-wallet.component.scss']
})
export class ExportWalletComponent implements OnInit {

  constructor(
    @Inject(ENV)
    private env: typeof environment,
    private readonly socialSharing: SocialSharing
  ) { }

  ngOnInit(): void {
  }

  async exportData(): Promise<void> {
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
    const keyFileData = { type: 'key', data: encodeBase64(keypair.secretKey) };

    if (this.env.platform === 'mobile') {
      const backupSavedFile = await Filesystem.writeFile({
        path: 'backup.json',
        data: JSON.stringify(backup),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const keySavedFile = await Filesystem.writeFile({
        path: 'key.json',
        data: JSON.stringify(keyFileData),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await this.socialSharing.shareWithOptions({
        files: [backupSavedFile.uri, keySavedFile.uri],
      });
    } else {
      const file = new Blob([JSON.stringify(backup)], { type: 'text/plain;charset=utf-8' });
      saveAs(file, 'backup.json');
      const file2 = new Blob([JSON.stringify(keyFileData)], { type: 'text/plain;charset=utf-8' });
      saveAs(file2, 'key.json');
    }

  }

}
