import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {Method} from "./method.state";
import {Update} from "@ngrx/entity";
import {MethodJSON} from "../../services/analysis-methods.service";
import {Parameter} from "../parameter/parameter.state";

export const methodActions = createActionGroup({
  source: 'GSA Methods',
  events: {
    'load': emptyProps(),
    'load success': props<{ methods: MethodJSON[] }>(),
    'load failure': props<{ error: any }>(),
    'select': props<{ methodName: string }>(),
    'update': props<{ update: Update<Method> }>(),
    'set params': props<{ methodName: string, parameters: Parameter[] }>(),
    'set selected params': props<{ parameters: Parameter[] }>(),
  }
})