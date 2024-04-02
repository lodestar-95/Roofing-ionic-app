/**
 * Contract to fulfill to write to storage
 * @author: Carlos Rodríguez
 */
export interface IWrite<T> {
  /**
   * Creates a new object of type <T> in storage.
   * @param item
   * @author: Carlos Rodríguez
   */
  create(item: T): Promise<boolean>;
  /**
   * Creates a new object list of type <T> in storage.
   * @param item
   * @author: Carlos Rodríguez
   */
   createSeveral(items: T[]): Promise<boolean>;
  /**
   * Updates the object with the sent ID of type <T> from storage.
   * @param id
   * @param item
   * @author: Carlos Rodríguez
   */
  update(id: number, item: T): Promise<boolean>;
  /**
   * Removes the object with the submitted ID of type <T> from storage.
   * @param id
   * @author: Carlos Rodríguez
   */
  delete(id: number): Promise<boolean>;
}
