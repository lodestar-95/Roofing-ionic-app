import { JobType } from './job-type.mode';
import { PsbMeasures } from './psb-measures.model';
import { JobMaterialType } from './job-material-type.mode';
import { Sync } from '../shared/interfaces/sync';
import { PbScope } from './pb-scope.model';

export interface Building extends Sync {
  id?: number;
  id_job_material_type: number;
  job_material_type: JobMaterialType;
  description: string;
  id_project: number; // No esta en tabla
  id_job_type: number;
  job_type: JobType; // No esta en tabla
  is_main_building?: any;
  deletedAt?: any;
  psb_measure: PsbMeasures; // No esta en tabla
  active: boolean;
  pb_scopes: PbScope[];
}
