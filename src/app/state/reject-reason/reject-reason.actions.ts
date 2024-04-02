import { createAction, props } from '@ngrx/store';
import { RejectReason } from '../../models/reject-reason.model';

export const unSetRejectReasons  = createAction('[RejectReason] Unset rejectReasons');

export const setRejectReasons = createAction(
  '[RejectReason] Set rejectReasons',
  props<{ rejectReasons: RejectReason[] }>()
);

