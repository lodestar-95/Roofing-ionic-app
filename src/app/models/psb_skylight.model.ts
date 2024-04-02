import { Sync } from "../shared/interfaces/sync";

export interface PsbSkylight extends Sync {
    id: number;
    skylights: string ;
    id_skylight_size: number;
    width?: number;
    lenght?: number;
    need_replace: boolean;
    id_fkit_option: number;
    aditional_cost: number;
    note: string;
    id_psb_measure: number;
    f_width?: string;
    f_lenght?: string;
    deletedAt?: any;
    on_rigde?: any;
}