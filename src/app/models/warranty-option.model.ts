import { CheckboxList } from "../shared/interfaces/checkbox-list";
import { WarrantyTypesOption } from './warranty-types-option.model';

export interface WarrantyOption extends CheckboxList {
  id: number;
  project_warranty_option: string;
  description?: string;
  warranty_types_options: WarrantyTypesOption[];

  isChecked: boolean;
}
