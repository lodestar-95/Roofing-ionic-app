import { CheckboxList } from "../shared/interfaces/checkbox-list";

export interface ShingleTypesRemove extends CheckboxList {
  id: number;
  shingle_type_remove: string;
  id_material_category: number;
  isChecked: boolean;
}
