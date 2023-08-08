import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {catchError, delayWhen, exhaustMap, filter, map, mergeMap, of, switchMap, tap, timer} from "rxjs";
import {datasetActions} from "./dataset.actions";
import {LoadDatasetService} from "../../services/load-dataset.service";
import {TypedAction} from "@ngrx/store/src/models";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {LoadingProgressComponent} from "../../datasets/select-dataset/loading-progress/loading-progress.component";
import {TableActions} from "../../utilities/table/state/table.action";
import {TableOrder} from "../../utilities/table/state/table.util";


@Injectable()
export class LoadedDatasetEffects {
  upload = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.upload),
    exhaustMap(({file, typeId, id}) => this.loadDatasetService.uploadFile(file).pipe(
      map(uploadData => datasetActions.uploadComplete({
        id,
        uploadData,
        typeId,
        name: file.name.substring(0, file.name.lastIndexOf("."))
      })),
      catchError((error) => of(datasetActions.uploadError({error, id})))
    ))
  ))

  load = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.load),
    exhaustMap(({resourceId, parameters, id}) => this.loadDatasetService.submitLoadDataset(resourceId, parameters).pipe(
      map(loadingId => datasetActions.loadSubmitted({loadingId, id})),
      catchError((error) => of(datasetActions.loadSubmittedError({error, id})))
    ))
  ))

  loadSubmitted = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.loadSubmitted),
    tap(({id}) => {
      this.dialogRef = this.dialog.open(LoadingProgressComponent, {
        width: '50%',
        height: '50%',
        disableClose: true,
        data: {datasetId: id}
      });
    }),
    map(({loadingId, id}) => datasetActions.getLoadStatus({loadingId, id}))
  ))

  loadStatus = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.getLoadStatus),
    switchMap(({loadingId, id}) => this.loadDatasetService.getLoadingStatus(loadingId).pipe(
      mergeMap(loadingStatus => {
        const actions: TypedAction<any>[] = [datasetActions.setLoadStatus({loadingStatus, id})];
        if (loadingStatus.status === "running") actions.push(datasetActions.getLoadStatus({loadingId, id}));
        else if (loadingStatus.status === "failed") actions.push(datasetActions.getLoadStatusError({
          error: loadingStatus.reports,
          id
        }));
        return actions
      }),
      delayWhen(action => action.type === '[GSA Dataset] get load status' ? timer(500) : timer(0)),
      catchError((error) => of(datasetActions.loadSubmittedError({error, id})))
    ))
  ))

  loadingToSummary = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.setLoadStatus),
    filter(({loadingStatus}) => loadingStatus.status === 'complete'),
    map(({loadingStatus, id}) => datasetActions.getSummary({
      datasetId: loadingStatus.dataset_id!,
      loadingId: loadingStatus.id,
      id
    }))
  ))

  getSummary = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.getSummary),
    exhaustMap(({loadingId, datasetId, id}) => this.loadDatasetService.getSummary(datasetId).pipe(
      map(summary => datasetActions.setSummary({summary, loadingId, id})),
      catchError((error) => of(datasetActions.loadSubmittedError({error, id}))),
      tap(() => setTimeout(() => this.dialogRef.close(), 500))
    ))
  ))


  summaryToAnnotate = createEffect(() => this.actions$.pipe(
    ofType(datasetActions.setSummary),
    map(({summary, id}) => {
      const table: string[][] = (!summary.sample_metadata) ?
        [[''], ...summary.sample_ids.map(sampleId => [sampleId])] :
        [
          ['', ...summary.sample_metadata.map(col => col.name)],
          ...summary.sample_ids.map((sampleId, i) => [sampleId, ...summary.sample_metadata!.map(column => column.values[i])])
        ]
      return TableActions.import({table, hasColNames: true, hasRowNames: true, order: TableOrder.ROW_BY_ROW})
    })
  ))


  dialogRef: MatDialogRef<LoadingProgressComponent>;

  constructor(
    private actions$: Actions,
    private dialog: MatDialog,
    private loadDatasetService: LoadDatasetService
  ) {
  }
}
