import { Sync } from "../shared/interfaces/sync";

export interface PsbNoRequired extends Sync {
    id: number;
	id_psb_measure: number;
	id_resource: number;
	no_required: boolean;
}