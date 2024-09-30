import { createAction, props } from '@ngrx/store';
import { Project } from '../models/project.model';

export const unSetProjects = createAction('[Prospection] Unset prospections');

export const setProjects = createAction(
  '[Prospection] Set prospections',
  props<{ projects: Project[] }>()
);

export const editProject = createAction(
  '[Prospection] Edit prospection',
  props<{ project: Project }>()
);

export const deleteProject = createAction(
  '[Prospection] Delete prospection',
  props<{ id: number }>()
);

export const setProject = createAction(
  '[Prospection] Set prospection',
  props<{ project: Project }>()
);


export const unSetProject = createAction('[Prospection] Unset prospection');

export const setBugs = createAction(
  '[Prospection] Set prospection',
  props<{ bug: any }>()
);