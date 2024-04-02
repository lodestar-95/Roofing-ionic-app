import { createReducer, on } from '@ngrx/store';
import { Project } from '../models/project.model';
import {
  setProjects,
  editProject,
  deleteProject,
  unSetProjects,
  setProject,
  unSetProject,
} from './prospecting.actions';

export interface State {
  projects: Project[];
  project: Project;
}

export const initialState: State = {
  projects: [],
  project: null
};

const _prospectingReducer = createReducer(
  initialState,
  on(setProjects, (state, { projects }) => ({
    ...state,
    projects: [...projects],
  })),
  on(unSetProjects, (state) => ({ ...state, projects: [] })),
  on(deleteProject, (state, { id }) => ({
    ...state,
    projects: state.projects.filter((x) => x.id !== id),
  })),
  on(editProject, (state, { project }) => ({
    ...state,
    projects: state.projects.map((x) => {
      if (x.id === project.id) {
        return {
          ...project,
        };
      } else {
        return x;
      }
    }),
  })),
  on(setProject, (state, { project }) => ({
    ...state,
    project: { ...project },
  })),
  on(unSetProject, (state) => ({ ...state, project: null })),

);

export function prospectingReducer(state, action) {
  return _prospectingReducer(state, action);
}
