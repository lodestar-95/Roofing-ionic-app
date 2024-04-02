import { Sync } from "../shared/interfaces/sync";

export class PbScope implements Sync {
  id: number;
  id_building: number;
  scope_of_work: string;
  is_verified: boolean;
  is_modified: boolean;
  id_material_type: number;
  is_architectural: boolean;
  in_final_proposal: boolean;
  title: string;
  isModified: boolean;

  constructor(
    id: number,
    id_building: number,
    scope_of_work: string,
    is_verified: boolean,
    is_modified: boolean,
    id_material_type: number,
    is_architectural: boolean,
    in_final_proposal: boolean,
    title: string
  ) {
    this.id = id;
    this.id_building = id_building;
    this.scope_of_work = scope_of_work;
    this.is_verified = is_verified;
    this.is_modified = is_modified;
    this.id_material_type = id_material_type;
    this.is_architectural = is_architectural;
    this.in_final_proposal = in_final_proposal;
    this.title = title;
    this.isModified = true;
  }
}
