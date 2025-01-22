import { ContactAddress } from './contact-address.model';
import { ProjectNote } from './project-note.model';
import { ProjectStatus } from './project-status.model';
import { Version } from './version.model';
import { UserSaleman } from './user-saleman.model';
import { ProspectingType } from './prospecting-type.model';
import { Sync } from '../shared/interfaces/sync';
import { ProjectContactDate } from './project-contact-date.model';
import { ProjectFile } from './project/project-file.model';

export interface Project extends Sync {
  id: number;
  project_name?: string;
  id_user_saleman: number;
  user_saleman: UserSaleman;
  next_contact_date: Date;
  next_contact_date_date?: Date;
  id_project_status: number;
  project_status: ProjectStatus;
  prospecting_start_date: string;
  id_contact_address: number;
  contact_address: ContactAddress;
  id_prospecting_type: number;
  prospecting_type?: ProspectingType;
  project_notes?: ProjectNote[];
  versions: Version[];
  //project_versions: ProjectVersion[];
  project_contact_dates?: ProjectContactDate[];
  id_reject_reason?: number;
  reject_reason?: string;

  id_job_priority?: number;
  start_date?: string;
  end_date?: string;
  project_files?: ProjectFile[];
  flag:string;

  // Search filters
  st_name: string;
  st_address: string;
  st_phone: string;
  st_email: string;
  st_project_status: string;
  st_prospecting_type: string;
  st_prospecting_material_type: string;
  st_job_type: string;
}
