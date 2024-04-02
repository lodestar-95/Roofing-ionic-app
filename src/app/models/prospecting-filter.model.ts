import { Filter } from "./filter.model";

export interface ProspectingFilter {
    assigned_inspector?: Filter[],
    type_estimation?: Filter[],
    material?: Filter[],
    type_of_work?: Filter[]
}