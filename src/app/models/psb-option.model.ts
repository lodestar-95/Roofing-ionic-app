import { Sync } from "../shared/interfaces/sync";

export interface PsbOption extends Sync {
  id: (number | string);
  id_psb_measure: number;
  option: string;
  cost: number;
  qty_hours: number;
  is_built_in: boolean;
  deletedAt?: any;
}
