import { createSelector } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Project } from 'src/app/models/project.model';
import { State } from '../propsecting.reducer';

export const selectProjectState = (state: AppState) => state.projects;

export const selectProjectDates = createSelector(
  selectProjectState,
  (state: State) => {
    const projectContactDates = state?.project?.project_contact_dates  || [];

    return [...projectContactDates].sort((a,b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime());
  }
);
export const selectProject = createSelector(
  selectProjectState,
  (state: State) => state?.project
);
export const selectProjectNextContactDate = createSelector(
  selectProject,
  (state: Project) => state?.project_contact_dates?.reduce((a, b) => new Date(a.contact_date) > new Date(b.contact_date) ? a : b)
);

export const selectProjectOneRidgeCap = createSelector(
  selectProject,
  (state: Project) => {

    const version = state?.versions?.find(v => v.active);
    const building = version?.buildings.find(b => b.active);
    const slopes = building?.psb_measure?.psb_slopes.filter(slope => !slope.deletedAt);
    return slopes.length === 1 ;
  }
);

export const selectProjectWithoutRidgeHips = createSelector(
  selectProject,
  (state: Project) => {

    const version = state?.versions?.find(v => v.active);
    const building = version?.buildings.find(b => b.active);
    const hips = building?.psb_measure?.hips_lf;
    const ridge = building?.psb_measure?.ridge_lf;
    return (!hips && !ridge);
  }
);

export const selectProjectWithoutRidge = createSelector(
  selectProject,
  (state: Project) => {

    const version = state?.versions?.find(v => v.active);
    const building = version?.buildings.find(b => b.active);
    const ridge = building?.psb_measure?.ridge_lf;
    return (!ridge);
  }
);
