import { Sync } from '../shared/interfaces/sync';

export interface Cost extends Sync {
  id: number;
  id_material_type_shingle: number;
  value: number;
  concept_type: string;
  id_concept_type: number;
  qty: number;
}
