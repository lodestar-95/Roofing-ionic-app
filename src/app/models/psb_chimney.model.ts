import { Sync } from "../shared/interfaces/sync";

export interface PsbChimney extends Sync {
    id: number;
    chimneys: string;
    on_rigde: boolean;
    width: number;
    lenght: number;
    cricket_exists:boolean;
    pitch?: number;
    cricket_height?: number;
    id_wall_material: number;
    need_cutsidding: boolean;
    need_ridglet: boolean;
    need_leakexclusion: boolean;
    need_endwall: boolean;
    aditional_cost: number;
    note: string;
    f_width: string;
    f_height?: string;
    f_lenght: string;
    id_psb_measure: number;
    deletedAt?: any;
    ridglet_lf:number;
}