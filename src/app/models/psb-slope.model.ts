import { Sync } from "../shared/interfaces/sync";

export interface PsbSlope extends Sync {
    id : number,
    name : string,
    pitch : number,
    shingle_area : number,
    floor : number,
    layers : number,
    osb_area : number,
    id_psb_measure : number,
    deletedAt: any,
    ridgecap_area?: number,
    starter_area?: number;
}