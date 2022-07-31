import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorParserService {

  constructor() { }

  parseCTApiResponse(err: any): string {
    if (err instanceof HttpErrorResponse) {
      if (err.error?.message) {
        return err.error.message;
      } else if (err.message) {
        return err.message;
      } else {
        return 'Unexpected error from the server, please contact support (XU-2477523)';
      }
    } else if (!!err?.message) {
      return err.message;
    } else {
      return 'Unexpected error, please contact support (XU-6437623)';
    }
  }
}
