import { Sync } from "../shared/interfaces/sync";

export interface PsbUpgradesVent extends Sync {
    id: number;
    id_psb_measure: number;
    ridgevents_lf: number;
    attic_replace_pc: number;
    attic_remove_pc: number;
    attic_cutin_pc: number;
    solar_pv_del_pc: number;
    pv_del_pc: number;
    solar_pv_new_pc: number;
    pv_new_pc: number;
    solar_pv_keep_pc: number;
    pv_keep_pc: number;
}