import { Sync } from '../shared/interfaces/sync';
import { Building } from './building.model';
import { PvColor } from './pv_color.model';
import { PvMaterialColor } from './pv_material_color.model';
import { PvTrademarks } from './pv_trademarks.model';
import { ShingleLine } from './shingle-lines.model';

export interface Version extends Sync {
  id: number;
  project_version: string;
  id_project: number;
  buildings: Building[];
  is_current_version: boolean;
  active: boolean; // Indica si es la que se muestra en pantalla
  shingle_lines: ShingleLine[];
  expected_acceptance_date: Date;
  pv_colors: PvColor[];
  pv_material_colors: PvMaterialColor[];
  pv_trademarks: PvTrademarks[];
  id_cost_type: number;
  is_verified: boolean;
}
