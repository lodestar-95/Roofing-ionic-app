import { Sync } from "../shared/interfaces/sync";

export interface PsbSelectedMaterial extends Sync {
  id: number;
  id_trademark_shingle: number;
  id_material_type_selected: number;
  id_psb_measure: number;
  id_material_category: number;
  deletedAt?: any;
}
