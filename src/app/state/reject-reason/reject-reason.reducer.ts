import { createReducer, on } from '@ngrx/store';
import { RejectReason } from '../../models/reject-reason.model';
import {
  setRejectReasons
} from './reject-reason.actions';

export interface State {
  reasons: RejectReason[];
}

export const initialState: State = {
  reasons: []
};

const _rejectReasonReducer = createReducer(
  initialState,
  on(setRejectReasons, (state, { rejectReasons }) => ({
    ...state,
    reasons: [...rejectReasons],
  }))
);

export function rejectReasonReducer(state, action) {
  return _rejectReasonReducer(state, action);
}
