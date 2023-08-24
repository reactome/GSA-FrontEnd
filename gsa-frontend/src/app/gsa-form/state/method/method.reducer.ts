import {ActionReducer, createReducer, on} from "@ngrx/store";
import {initialState, methodAdapter, MethodState} from "./method.state";
import {methodActions} from "./method.action";
import {parameterActions} from "../parameter/parameter.action";
import {parameterAdapter} from "../parameter/parameter.state";


export const methodReducer: ActionReducer<MethodState> = createReducer(
    initialState,
    on(methodActions.loadSuccess, (state, {methods}) => methodAdapter.addMany(methods.map(method => ({...method, parameters: method.parameters.filter(param => param.name !== 'sample_groups')})), state)),
    on(methodActions.update, (state, {update}) => methodAdapter.updateOne(update, state)),
    on(methodActions.setParams, (state, {methodName, parameters}) => methodAdapter.updateOne({
        id: methodName,
        changes: {parameters}
    }, state)),
    on(methodActions.setSelectedParams, (state, {parameters}) => state.selectedMethodName ?
        methodAdapter.updateOne({
            id: state.selectedMethodName,
            changes: {parameters}
        }, state) :
        state),
    on(methodActions.select, (state, {methodName}) => ({...state, selectedMethodName: methodName})),
)