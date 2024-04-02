import { Sync } from '../shared/interfaces/sync';
import { Cost } from './cost.model';

export interface LaborCost extends Sync, Cost {
  layerNumber: number;
  id: number;
  shingle_area: number;
  ridgecap_area: number;
  starter_area: number;
  total_area: number;
  sq_cost: number;
  total_cost: number;
  pitch : number;
  floor : number;
  layer : number;
  id_psb_measure : number;
  id_labor_type: number;
  id_tearoff_material: number;
  id_material_type: number;
  total: number;
  price:number;
  id_labor_cost: number;
  slope: Object;
  id_labor_category:number;
  labor_type: string;
  id_material_category: number;
}
