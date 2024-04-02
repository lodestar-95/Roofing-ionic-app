import { Sync } from "../shared/interfaces/sync";

export interface PsbMaterialCalculation extends Sync {
    id: number;
    id_concept: number;
    quantity: number;
    cost: number;
    id_material: number;
    id_material_shingle: number;
    id_psb_measure: number;
    id_concept_type: number;
    id_material_price_list: number;
    deletedAt?: any;
    from_original_proposal: boolean;
    is_updated: boolean;
  }
