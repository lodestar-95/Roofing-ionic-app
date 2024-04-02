import { ActionReducerMap } from '@ngrx/store';
import * as prospectingReducer from './prospecting/propsecting.reducer';
import * as uiReducer from "./shared/ui.reducer";
import * as rejectReasonReducer from './state/reject-reason/reject-reason.reducer';

export interface AppState {
  ui: uiReducer.State;
  projects: prospectingReducer.State;
  rejectReasons: rejectReasonReducer.State
}

export const appReducers: ActionReducerMap<AppState> = {
  ui: uiReducer.uiReducer,
  projects: prospectingReducer.prospectingReducer,
  rejectReasons: rejectReasonReducer.rejectReasonReducer,
};
