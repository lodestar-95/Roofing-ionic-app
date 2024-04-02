export interface CostCalulation {
  data: Data;
}

interface Data {
  buildings: any[];
  projects: Project[];
}

interface Project {
  totals: number;
  upgrades: number;
  builtins: number;
  options: number;
  id_concept_type: number;
  id_material_type_shingle: number;
}
