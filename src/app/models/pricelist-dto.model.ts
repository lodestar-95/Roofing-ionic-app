import { PriceList } from "./price-list.model";

export interface PriceListDto extends PriceList {
    supplier: string;
  }