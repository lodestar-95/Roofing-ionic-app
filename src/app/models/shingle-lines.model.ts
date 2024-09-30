import { Sync } from "../shared/interfaces/sync";

export interface ShingleLine extends Sync {
  id: number;
  id_version: number;
  id_material_type: number;
  is_selected: boolean;
  deletedAt?: string;
}
