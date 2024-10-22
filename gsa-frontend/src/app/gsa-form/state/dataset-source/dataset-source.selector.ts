import {createFeature, createSelector} from "@ngrx/store";
import {datasetSourceReducer} from "./dataset-source.reducer";
import {datasetSourceAdapter, PDatasetSource, Source} from "./dataset-source.state";
import {isDefined} from "../../utilities/utils";
import {Method} from "../method/method.state";

export const datasetSourceFeature = createFeature({
  name: 'datasetSource',
  reducer: datasetSourceReducer,
  extraSelectors: ({selectDatasetSourceState, selectEntities, selectIds, selectSelectedSourceId}) => ({
    ...datasetSourceAdapter.getSelectors(selectDatasetSourceState),
    selectBySource: (source: Source, method: Method) => createSelector(selectEntities, selectIds, (entities, ids) => {
      let filteredEntities = ids?.map(id => entities[id])
        .filter(entity => entity?.source === source)
        .filter(isDefined)
      if (method?.name !== 'PADOG') filteredEntities = filteredEntities.filter(e => e.id !== 'ribo_seq')

      // filter examples based on the selected analysis method, B_CELLS is only compatible with ssGSEA analysis method
      if (method?.name === 'ssGSEA') {
        return filteredEntities.filter(entity => !['EXAMPLE_RIBO_SEQ'].includes(entity.id));
      } else if (method?.name === 'PADOG') {
        return filteredEntities.filter(entity => !['EXAMPLE_SC_B_CELLS'].includes(entity.id));
      } else if (method?.name === 'Camera') {
        return filteredEntities.filter(entity => !['EXAMPLE_SC_B_CELLS', 'EXAMPLE_RIBO_SEQ'].includes(entity.id));
      }
      return filteredEntities;
    }),
    selectDatasetSource: (id: string) => createSelector(selectEntities, entities => entities[id]),
    selectSelectedSource: createSelector(selectEntities, selectSelectedSourceId, (entities, selectedSourceId) => selectedSourceId != null ? entities[selectedSourceId] : null),
    selectIsSelected: (source: PDatasetSource) => createSelector(selectSelectedSourceId, (id) => source.id === id),
  })
})
