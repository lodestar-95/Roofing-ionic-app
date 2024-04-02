import { CostIntegration } from './cost-integration.model';
import { WarrantyType } from './warranty-type.model';

export interface WarrantyTypesOption {
  id: number;
  id_warranty_option: number;
  id_warranty_type: number;
  id_cost_integration: number;
  warranty_type: WarrantyType;
  cost_integration: CostIntegration;
}
