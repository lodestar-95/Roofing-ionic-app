import { Sync } from "../shared/interfaces/sync";

export interface PsbCrickets extends Sync{
 id: number;
 cricket: string;
 area: number;
 pitch: number;
 first_valley_lf: number;
 second_valley_lf?: number;
 sidewall_lf?: number;
 id_wall_material_sw?: number;
 endwall_lf?: number;
 id_wall_material_ew?: number;
 aditional_cost: number;
 note: string;
 is_cut_sw?: boolean;
 is_ridglet_sw?: boolean;
 is_leak_sw?: boolean;
 is_cut_ew?: boolean;
 is_ridglet_ew?: boolean;
 is_leak_ew?: boolean;
 id_psb_measure: number;
 deletedAt?: any;

}