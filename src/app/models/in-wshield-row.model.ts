import { CheckboxList } from "../shared/interfaces/checkbox-list";

export interface InwshieldRow extends CheckboxList {
  id: number;
  inwsield_rows_option: string;
  lineal_feets_eves: number;
  lineal_feets_valleys: number;
  rows_eves: number;
  rows_valleys: number;
  isChecked: boolean;
  sub_title: string;
}
