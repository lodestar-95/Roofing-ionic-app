import { User } from 'src/app/models/user.model';
import { Sync } from '../shared/interfaces/sync';

export interface ProjectNote extends Sync {
  id?: any;
  note?: any;
  show_on_work_order?: any;
  id_user?: any;
  datetime?: any;
  id_project?: any;
  user: User;
}
