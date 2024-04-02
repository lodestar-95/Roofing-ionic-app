import { CheckboxList } from "../shared/interfaces/checkbox-list";

export interface CostIntegration extends CheckboxList {
  id: number;
  cost_integration: (string | number);

  isChecked: boolean;
}
