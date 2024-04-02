import { ApiResponse } from "../interfaces/api-response";

/**
 * Contract to fulfill to read the storage
 * @author: Carlos Rodríguez
 */
export interface IRead<T> {
  /**
   * Query storage for list of type <T>
   * @author: Carlos Rodríguez
   */
  findAll(): Promise<ApiResponse<T[]>>;
  /**
   * Query storage for an object of type <T> by id
   * @param id
   * @author: Carlos Rodríguez
   */
  findOne(id: number): Promise<ApiResponse<T>>;
}
