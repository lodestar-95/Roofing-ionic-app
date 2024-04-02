import { CheckboxList } from "../shared/interfaces/checkbox-list";

export interface MeasuresMaterialType extends CheckboxList {
    id: number;
    material_type: string;
    id_material_category: number;
    id_trademark: number;
    isChecked: boolean;
    size: number;
}
  