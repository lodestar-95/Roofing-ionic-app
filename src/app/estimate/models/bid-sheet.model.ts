export interface Table {
  columnNames: string[];
  sections: Section[];
  totals: Total[];
}

export interface Section {
  title: string;
  concepts: Concept[];
}

export interface Concept {
  description: string;
  coverage: number;
  coverage_description: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  sqlf: number;
}

export interface Total {
  description: string;
  value: number;
}
