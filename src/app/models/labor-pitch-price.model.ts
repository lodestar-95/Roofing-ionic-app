export interface LaborPitchPrice {
  id: number;
  pitch: number;
  id_labor_type: number;
  price: number;
  labor_type: string;
  id_labor_category: number;
  id_job_type: number;
  id_material_category: number;
  category: string;
  job_type: string;
  material_category: string;
  layer: number;
  floor_slope: number;
}