import { Resource } from './resource.model';
import { Role } from './role.model';

export interface RoleResource {
  id_role: string;
  id_resource: number;
  can_read: string;
  can_write: string;
  id_role_resources: string;
  resources: Resource[];
  roles: Role[];
}
