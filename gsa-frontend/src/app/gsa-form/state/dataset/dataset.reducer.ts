import {ActionReducer, createReducer, on} from '@ngrx/store';
import {datasetAdapter, DatasetState, initialState, PDataset} from './dataset.state';
import {datasetActions} from './dataset.actions';
import {DataSummary} from '../../model/load-dataset.model';
import {Subset} from "../../model/utils.model";
import {cp, transpose} from "reactome-table";
import {EntityHelper, isDefined} from "../../utilities/utils";


const helper = new EntityHelper<PDataset, DatasetState>(datasetAdapter);

export const datasetReducer: ActionReducer<DatasetState> = createReducer(
  initialState,
  on(datasetActions.add, (state) =>
    datasetAdapter.addOne(
      {id: state.lastId, saved: false},
      {
        ...state,
        lastId: state.lastId + 1,
      },
    ),
  ),
  on(datasetActions.delete, (state, {id}) =>
    datasetAdapter.removeOne(id, state),
  ),
  on(datasetActions.clear, (state, {id}) =>
    datasetAdapter.setOne({id, saved: false}, state),
  ),
  on(datasetActions.save, (state, {id}) =>
    datasetAdapter.updateOne({id, changes: {saved: true},}, state),
  ),
  on(datasetActions.load, (state, {id}) => datasetAdapter.updateOne({
    id, changes: {loadingStatus: {id: 'unknown', status: 'pending', description: 'Sending load request to server'}, public: true}
  }, state)),
  on(datasetActions.uploadRibo, (state, {id}) => datasetAdapter.updateOne({
    id, changes: {loadingStatus: {id: 'unknown', status: 'pending', description: 'Sending your data to servers'}, public: false}
  }, state)),
  on(datasetActions.upload, (state, {id}) => datasetAdapter.updateOne({
    id, changes: {loadingStatus: {id: 'unknown', status: 'pending', description: 'Sending your data to servers'}, public: false}
  }, state)),
  on(datasetActions.loadSubmitted, (state, {loadingId, id}) =>
    datasetAdapter.updateOne(
      {
        id,
        changes: {
          loadingStatus: {
            id: loadingId,
            status: 'running',
          },
        },
      },
      state,
    ),
  ),
  on(datasetActions.setLoadStatus, (state, {loadingStatus, id}) =>
    datasetAdapter.updateOne(
      {
        id,
        changes: {loadingStatus},
      },
      state,
    ),
  ),
  on(datasetActions.setSummary, (state, {summary, id}) =>
    datasetAdapter.updateOne(
      {
        id,
        changes: {summary, originalTitle: summary.title},
      },
      state,
    ),
  ),
  on(datasetActions.setAnnotations, (state, {annotations, id}) =>
    datasetAdapter.updateOne(
      {
        id,
        changes: {
          annotations: annotations,
        },
      },
      state,
    ),
  ),

  on(datasetActions.initAnnotationColumns, (state) =>
    datasetAdapter.updateMany(state.ids.map(id => state.entities[id]).filter(isDefined).map(dataset => {
      const annotations = dataset.annotations!;

      const annotationsWithSimpleIds = cp(annotations);
      annotationsWithSimpleIds[0][0] = 'sample_ids';

      return {
        id: dataset.id,
        changes: {
          annotationColumns: new Map<string, string[]>(transpose(annotationsWithSimpleIds).map(col => [col[0], col.slice(1)]))
        }
      }
    }), state)),

  on(datasetActions.uploadComplete, (state, {uploadData, name, typeId, id}) =>
    datasetAdapter.updateOne(
      {
        id,
        changes: {
          summary: {
            id: uploadData.data_token,
            title: name,
            type: typeId,
            sample_ids: uploadData.sample_names,
          },
        },
      },
      state,
    ),
  ),
  on(datasetActions.updateSummary, (state, {update}) =>
    helper.update(update.id, state, dataset => ({
      summary: {
        ...dataset.summary,
        ...(update.changes as Subset<DataSummary>),
      },
    }))),

  on(datasetActions.initStatisticalDesign, (state, {id}) =>
    helper.update(id, state, dataset => {
        const summary = dataset.summary!;
        const defaultCovariances = new Set<string>((summary.default_parameters || [])
          .find(param => param.name === 'covariates')?.value
          .split(','));
        const defaultGroup1 = (summary.default_parameters || []).filter((param) => param.name === 'comparison_group_1')[0]?.value;
        const defaultGroup2 = (summary.default_parameters || []).filter((param) => param.name === 'comparison_group_2')[0]?.value;
        const defaultComparisonFactor = (summary.default_parameters || []).filter((param) => param.name === 'analysis_group')[0]?.value;

        return {
          statisticalDesign: {
            analysisGroup: defaultComparisonFactor,
            comparisonGroup1: defaultGroup1,
            comparisonGroup2: defaultGroup2,
            defaultCovariances,
            defaultGroup1,
            defaultGroup2,
            defaultComparisonFactor,
            covariances: []
          }
        }
      },
    )
  ),

  on(datasetActions.initCovariances, (state, {id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        covariances: dataset.annotations?.[0].slice(1) //slice the first element, which is the empty string
          .filter(name => name !== dataset.statisticalDesign!.analysisGroup)
          .map(name => ({name, value: dataset.statisticalDesign!.defaultCovariances.has(name)})) || []
      },
    })),
  ),

  on(datasetActions.setAnalysisGroup, (state, {group, id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        analysisGroup: group,
        comparisonGroup1: group === dataset.statisticalDesign!.defaultComparisonFactor ? dataset.statisticalDesign!.defaultGroup1 : undefined,
        comparisonGroup2: group === dataset.statisticalDesign!.defaultComparisonFactor ? dataset.statisticalDesign!.defaultGroup2 : undefined,
      }
    }))),

  on(datasetActions.setComparisonGroup1, (state, {group, id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        comparisonGroup1: group
      }
    }))),

  on(datasetActions.setComparisonGroup2, (state, {group, id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        comparisonGroup2: group
      }
    }))),

  on(datasetActions.setCovariateValue, (state, {group, value, id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        covariances: dataset.statisticalDesign!.covariances.map(cov => cov.name === group ? {...cov, value} : cov)
      }
    }))),

  on(datasetActions.setCovariatesValue, (state, {value, id}) =>
    helper.update(id, state, dataset => ({
      statisticalDesign: {
        ...dataset.statisticalDesign!,
        covariances: dataset.statisticalDesign!.covariances.map(cov => ({...cov, value}))
      }
    }))),

  on(datasetActions.setSummaryParameters, (state, {id, parameters}) =>
    helper.update(id, state, dataset => ({
      summary: {
        ...dataset.summary!,
        parameters
      }
    }))),

  on(datasetActions.resetSummaryParameters, (state, {id}) =>
    helper.update(id, state, dataset => ({
      summary: {
        ...dataset.summary!,
        parameters: dataset.summary!.parameters?.map(p => ({...p, value: p.default}))
      }
    }))),
);
