import {Injectable, ViewChild} from '@angular/core';
import {environment} from "../../../environments/environment";
import {Dataset, ExampleDataset} from "../model/fetch-dataset.model";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {map, Observable, tap} from "rxjs";
import {Method} from "../model/methods.model";
import {DataSummary, LoadingStatus} from "../model/load-dataset.model";
import {UploadData} from "../model/upload-dataset-model";
import {Validators} from "@angular/forms";
import {CellValue} from "handsontable/common";
import {CellInfo} from "../model/table.model";
import {MatStepper} from "@angular/material/stepper";

@Injectable({
  providedIn: 'root'
})
export class LoadDatasetService {
  stepper: MatStepper
  loadDataUrl = `${environment.ApiRoot}/data/load/`;
  loadingStatusUrl = `${environment.ApiRoot}/data/status/`;
  summaryDataUrl = `${environment.ApiRoot}/data/summary/`;
  uploadDataUrl = `${environment.ApiSecretRoot}/upload`;
  loadingId?: string
  loadingStatus?: LoadingStatus;
  dataSummary: DataSummary[] = []
  private timer: NodeJS.Timer;
  // columns: string[] = [
  //   "cell.type",
  //   "cell.group",
  // ]
  // rows: string[] = [
  //   "cluster 1",
  //   "cluster 2",
  //   "cluster 3",
  //   "cluster 4",
  //   "cluster 5",
  //   "cluster 6",
  //   "cluster 7",
  //   "cluster 8",
  //   "cluster 9",
  //   "cluster 10",
  //   "cluster 11",
  //   "cluster 12",
  //   "cluster 13"
  // ]
  // dataset: CellInfo[][] = [
  //   [new CellInfo("Memory 0"), new CellInfo("Normal 0")],
  //   [new CellInfo("Memory 1"), new CellInfo("Normal 1")],
  //   [new CellInfo("Memory 2"), new CellInfo("Normal 2")],
  //   [new CellInfo("Memory 3"), new CellInfo("Normal 3")],
  //   [new CellInfo("Memory 4"), new CellInfo("Normal 4")],
  //   [new CellInfo("Memory 5"), new CellInfo("Normal 5")],
  //   [new CellInfo("Memory 6"), new CellInfo("Normal 6")],
  //   [new CellInfo("Memory 7"), new CellInfo("Normal 7")],
  //   [new CellInfo("Memory 8"), new CellInfo("Normal 8")],
  //   [new CellInfo("Memory 9"), new CellInfo("Normal 9")],
  //   [new CellInfo("Memory 0"), new CellInfo("Normal 0")],
  //   [new CellInfo("Memory 1"), new CellInfo("Normal 1")],
  //   [new CellInfo("Memory 2"), new CellInfo("Normal 2")],
  // ]
  columns : string[][] = [];
  rows : string [][] = [];
  datasets : CellValue[][][] = [];
  currentDataset : number;
  loadingProgress: string = 'not started';


  constructor(private http: HttpClient) {
  }

  loadDataset(resourceId: string, postParameters: any): void {
    this.loadingProgress = 'loading';
    this.loadingStatus = undefined;
    this.getLoadingId(resourceId, postParameters)
    this.timer = setInterval(() => this.getLoadingStatus(), 1000)
  }

  private getLoadingStatus(): void {
    this.http.get<LoadingStatus>(this.loadingStatusUrl + this.loadingId)
      .subscribe((status) => {
        this.loadingStatus = status;
        if (this.loadingStatus?.status === 'complete') {
          clearInterval(this.timer);
          this.processDataSummary()
          this.loadingProgress = 'completed'
        }
        if (this.loadingStatus?.status === 'failed') {
          clearInterval(this.timer);
          this.loadingProgress = 'failed'
        }
      })
  }

  getLoadingId(resourceId: string, postParameters: any): void {
    this.http.post(this.loadDataUrl + resourceId, postParameters, {responseType: 'text'}).subscribe(
      response => this.loadingId = response)
  }


  processDataSummary(): void {
    this.http.get<DataSummary>(this.summaryDataUrl + this.loadingStatus?.dataset_id)
      .subscribe((summary) => {
        this.dataSummary.push(summary);
        this.computeTableValues();
      })
  }

  computeTableValues() {
    if (this.currentDataset === undefined) {
      this.currentDataset = 0
    }
    else this.currentDataset += 1
    this.rows.push(this.dataSummary[this.currentDataset].sample_ids.map(id => id));
    this.datasets.push(this.dataSummary[this.currentDataset].sample_metadata[0].values.map(() => []));
    this.columns.push(this.dataSummary[this.currentDataset].sample_metadata.map(data => {
      data.values.forEach((value, i) =>
        this.datasets[this.currentDataset][i % this.rows[this.currentDataset].length].push(new CellInfo(value)))
      return data.name;
    }))
    this.stepper.next()
  }


  uploadFile(file: File): void {
    const formData = new FormData();
    formData.append('file', file, file.name);
    let uploadDataObservable = this.http.post<UploadData>(this.uploadDataUrl, formData);
    uploadDataObservable.subscribe(response => {
        this.rows.push(response.sample_names)
        this.columns.push(["Annotation1"])
        this.datasets = [[]]
        this.rows.forEach((row) =>
          this.datasets[this.currentDataset].push([new CellInfo()]))
        this.stepper.next()
      }
    )

  }

  getColumn(colName: any): any[] {
    let colIndex = this.columns[this.currentDataset].indexOf(colName)
    let colValues: any[] = []
    this.datasets[this.currentDataset].forEach((row) => {
      {
        colValues.push(row[colIndex].value)
      }
    })
    return colValues
  }
}
