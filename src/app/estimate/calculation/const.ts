export const CALCULATION_TYPES = [{ id: 1, calculation_type: 'shingle' }];

export const ERRORS = {
  NO_SLOPE: { is_success: false, code: 'E001', error: 'No slopes found' },
};

export const OK = { is_success: true, code: 'A001', message: '' };

export const CALCULATION_SCHEMA = {
  id: null,
  calculation_type: null,
  value: null,
  id_concept: null,
  concept_type: null,
  id_material_type_shingle: null,
  concept: null,
  cost: null,
  coverage: null,
  unit_abbrevation: null,
  qty: null,
  id_material_type: null,
  unit: null,
  category: null,
  is_final: null,
};
