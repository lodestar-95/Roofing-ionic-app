import { Sync } from "../shared/interfaces/sync";

export interface PsbUpgrade extends Sync {
    id_upgrade?: number;
    id?: number;
    id_project?: number;
    id_cost_integration?: number;
}