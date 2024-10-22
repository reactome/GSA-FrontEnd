import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {
  catchError,
  combineLatestWith,
  delay,
  delayWhen,
  exhaustMap,
  filter,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
  timer
} from "rxjs";
import {datasetActions} from "./dataset.actions";
import {LoadDatasetService} from "../../services/load-dataset.service";
import {TypedAction} from "@ngrx/store/src/models";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {Store} from "@ngrx/store";
import {methodFeature} from "../method/method.selector";
import {
  LoadingProgressComponent
} from "../../dataset-form/datasets/select-dataset/loading-progress/loading-progress.component";
import {
  ChangeAnalysisParamsComponent
} from "../../dataset-form/datasets/change-analysis-params/change-analysis-params.component";
import {TourUtilsService} from "../../../services/tour-utils.service";


@Injectable()
export class DatasetEffects {

  upload = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.upload),
      tap(({id}) => {
        this.dialogRef = this.dialog.open(LoadingProgressComponent, {
          width: '50%',
          height: '50%',
          disableClose: true,
          data: {datasetId: id},
        });
      }),
      exhaustMap(({file, typeId, id}) =>
        this.loadDatasetService.uploadFile(file).pipe(
          map((uploadData) =>
            datasetActions.uploadComplete({
              id,
              uploadData,
              typeId,
              name: file.name.substring(0, file.name.lastIndexOf('.')),
            }),
          ),
          catchError((error) => of(datasetActions.uploadError({error, id}))),
        ),
      ),
    ),
  );

  uploadRibo = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.uploadRibo),
      tap(({id}) => {
        this.dialogRef = this.dialog.open(LoadingProgressComponent, {
          width: '50%',
          height: '50%',
          disableClose: true,
          data: {datasetId: id},
        });
      }),
      exhaustMap(({fileRibo, fileRNA, typeId, id}) =>
        this.loadDatasetService.uploadRiboFiles(fileRNA, fileRibo).pipe(
          map((uploadData) =>
            datasetActions.uploadComplete({
              id,
              uploadData,
              typeId,
              name: fileRNA.name.substring(0, fileRNA.name.lastIndexOf('.')),
            })
          ),
          catchError((error) => of(datasetActions.uploadError({error, id})))
        ),
      ),
    ),
  );


  uploadCompleteToSummary = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.uploadComplete),
      map(({uploadData, name, typeId, id}) =>
        datasetActions.setSummary({
          id,
          summary: {
            id: uploadData.data_token,
            title: name,
            type: typeId,
            sample_ids: uploadData.sample_names,
          },
        }),
      ),
    ),
  );

  load = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.load),
      tap(({id}) => {
        this.dialogRef = this.dialog.open(LoadingProgressComponent, {
          width: '50%',
          height: '50%',
          disableClose: true,
          data: {datasetId: id},
        });
      }),
      exhaustMap(({resourceId, parameters, id}) =>
        this.loadDatasetService.submitLoadDataset(resourceId, parameters).pipe(
          map((loadingId) => datasetActions.loadSubmitted({loadingId, id})),
          catchError((error) =>
            of(datasetActions.loadSubmittedError({error, id})),
          ),
        ),
      ),
    ),
  );

  loadSubmitted = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.loadSubmitted),
      delay(500),
      map(({loadingId, id}) => datasetActions.getLoadStatus({loadingId, id}),
      ),
    ),
  );

  loadStatus = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.getLoadStatus),
      switchMap(({loadingId, id}) =>
        this.loadDatasetService.getLoadingStatus(loadingId).pipe(
          mergeMap((loadingStatus) => {
            const actions: TypedAction<any>[] = [datasetActions.setLoadStatus({loadingStatus, id})];
            if (loadingStatus.status === 'running')
              actions.push(datasetActions.getLoadStatus({loadingId, id}));
            else if (loadingStatus.status === 'failed') {
              actions.push(datasetActions.getLoadStatusError({error: loadingStatus.reports, id}));
            }
            return actions;
          }),
          delayWhen((action) =>
            action.type === '[GSA Dataset] get load status'
              ? timer(500)
              : timer(0),
          ),
          catchError((error) => of(datasetActions.getLoadStatusError({error, id})),
          ),
        ),
      ),
    ),
  );

  loadError = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.loadSubmittedError, datasetActions.getLoadStatusError),
      delay(2000),
      tap(() => this.dialogRef.close())
    ), {dispatch: false}
  );

  loadingToSummary = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.setLoadStatus),
      filter(({loadingStatus}) => loadingStatus.status === 'complete'),
      map(({loadingStatus, id}) =>
        datasetActions.getSummary({
          datasetId: loadingStatus.dataset_id!,
          id,
        }),
      ),
    ),
  );

  getSummary = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.getSummary),
      exhaustMap(({datasetId, id}) =>
        this.loadDatasetService.getSummary(datasetId).pipe(
          map((summary) => datasetActions.setSummary({summary, id})),
          catchError((error) => of(datasetActions.loadSubmittedError({error, id}))),
        ),
      ),
    ),
  );

  summaryToAnnotate = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.setSummary),
      tap(() => setTimeout(() => this.dialogRef.close(), 500)),
      map(({summary, id}) => {
        setTimeout(() => this.tour.paused ? this.tour.resume() : null, 1000);
        const table: string[][] = !summary.sample_metadata
          ? [[''], ...summary.sample_ids.map((sampleId) => [sampleId])]
          : [
            ['', ...summary.sample_metadata.map((col) => col.name)],
            ...summary.sample_ids.map((sampleId, i) => [
              sampleId,
              ...summary.sample_metadata!.map((column) => column.values[i]),
            ]),
          ];
        return datasetActions.setAnnotations({annotations: table, id});
      }),
    ),
  );

  initStatisticalDesign = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.setAnnotations),
      map(({id}) => datasetActions.initStatisticalDesign({id})),
    ),
  );

  initStatsToInitCovs = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.initStatisticalDesign),
      map(({id}) => datasetActions.initCovariances({id})),
    ),
  );

  setAnalysisGroupToInitCovs = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.setAnalysisGroup),
      map(({id}) => datasetActions.initCovariances({id})),
    ),
  );

  summaryAndMethodToParameters = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.setSummary),
      combineLatestWith(this.store.select(methodFeature.selectSelectedMethod)),
      map(([summary, method]) => datasetActions.setSummaryParameters({
        id: summary.id,
        parameters: (method?.parameters
          .filter((param) => param.scope === 'dataset')
          .map(param => ({
            ...param,
            default: param.value // Method param is the default value for the dataset param
          })) || [])
      })),
    )
  );


  openParameters = createEffect(() =>
    this.actions$.pipe(
      ofType(datasetActions.openSummaryParameters),
      map(({id}) => {
        this.changeAnalysisParamsDialogRef = this.dialog.open(ChangeAnalysisParamsComponent, {data: {datasetId: id}})
        return datasetActions.openSummaryParametersSuccess({id})
      }),
    ))


  dialogRef: MatDialogRef<LoadingProgressComponent>;

  changeAnalysisParamsDialogRef: MatDialogRef<ChangeAnalysisParamsComponent>;


  constructor(
    private actions$: Actions,
    private dialog: MatDialog,
    private loadDatasetService: LoadDatasetService,
    private store: Store,
    private tour: TourUtilsService
  ) {
  }
}
