import {Injectable} from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {DataSummary, LoadingStatus, PLoadingStatus} from "../model/load-dataset.model";
import {UploadData} from "../model/upload-dataset-model";
import {catchError, EMPTY, Observable, of, throwError} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {extractErrorMessage} from "../utilities/utils";
import {formatDate} from "@angular/common";


@Injectable({
    providedIn: 'root'
})
export class LoadDatasetService {
    // stepper: MatStepper;
    loadDataUrl = `${environment.ApiRoot}/data/load/`;
    loadingStatusUrl = `${environment.ApiRoot}/data/status/`;
    summaryDataUrl = `${environment.ApiRoot}/data/summary/`;
    uploadDataUrl = `${environment.ApiSecretRoot}/upload`;
    uploadRiboDataUrl = `${environment.ApiSecretRoot}/uploadRibo`;

    constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    }

    snackError<T>(err: HttpErrorResponse, failValue$: Observable<T>): Observable<T> {
        this.snackBar.open("The chosen dataset could not been loaded: \n"  + extractErrorMessage(err), "Close", {
            panelClass: ['warning-snackbar'],
            duration: 10000
        });
        return failValue$;
    }

    submitLoadDataset(resourceId: string, postParameters: { name: string, value: any }[]): Observable<string> {
        return this.http.post(this.loadDataUrl + resourceId, postParameters, {responseType: 'text'})
            .pipe(catchError((err: HttpErrorResponse) => {
                this.snackBar.open("The chosen dataset could not been loaded: \n"  + extractErrorMessage(err), "Close", {
                    panelClass: ['warning-snackbar'],
                    duration: 10000
                });
                return throwError(() => err);    //Rethrow it back to component
            }))
    }

    getLoadingStatus(loadingId: string): Observable<PLoadingStatus> {
        return this.http.get<LoadingStatus>(this.loadingStatusUrl + loadingId).pipe(
            catchError(err => this.snackError<PLoadingStatus>(err, of({id: loadingId, status: 'failed', description: err.message})))
        );
    }

    getSummary(datasetId: string): Observable<DataSummary> {
        return this.http.get<DataSummary>(this.summaryDataUrl + datasetId).pipe(
            catchError(err => this.snackError(err, EMPTY)));
    }


    uploadFile(file: File): Observable<UploadData> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<UploadData>(this.uploadDataUrl, formData)
            .pipe(catchError((err: HttpErrorResponse) => {
                this.snackBar.open("The chosen dataset could not been uploaded: \n"  + extractErrorMessage(err), "Close", {
                    panelClass: ['warning-snackbar'],
                    duration: 10000
                });
                return throwError(() => err);    //Rethrow it back to component
            }))
    }

    uploadRiboFiles(fileRNA: File, fileRibo: File): Observable<UploadData>{
      const formData = new FormData();
      formData.append('fileRNA', fileRNA, fileRNA.name);
      formData.append('fileRibo', fileRibo, fileRibo.name);
      return this.http.post<UploadData>(this.uploadRiboDataUrl, formData)
        .pipe(catchError((err: HttpErrorResponse) => {
          this.snackBar.open("The chosen dataset could not been uploaded: \n"  + extractErrorMessage(err), "Close", {
            panelClass: ['warning-snackbar'],
            duration: 10000
          });
          return throwError(() => err);    //Rethrow it back to component
        }))
    }
}
