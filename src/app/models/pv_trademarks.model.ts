import { Sync } from "../shared/interfaces/sync";

export interface PvTrademarks extends Sync {
    id?: number;
    id_version: number;
    id_trademarks: number;
    selected:boolean;
  }
  