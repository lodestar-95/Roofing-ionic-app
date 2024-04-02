import { IRepository } from './IRepository';
import { Storage } from '@ionic/storage';
import { ApiResponse } from '../interfaces/api-response';

/**
 * Interactive with storage for managing data structures
 * @author: Carlos Rodríguez
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  storage: Storage;
  key: string;

  constructor(storage: Storage, key: string) {
    this.storage = storage;
    this.key = key;
  }

  /**
   * Insert an element in the list if it does not exist.
   * @param item
   * @returns
   * @author: Carlos Rodríguez
   */
  async create(item: any): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let items: any[] = [];

        let storage: any[] = await this.storage.get(this.key);
        items = storage == null ? [] : storage;

        if (items) {
          const exist = items.find((x: any) => x.id == item.id);
          if (!exist) {
            items.unshift(item);
            this.storage.set(this.key, items);
            resolve(true);
          }else{
            resolve(false);
          }
        } else {
          items.unshift(item);
          this.storage.set(this.key, items);
          resolve(true);
        }
      } catch {
        reject(false);
      }
    });
  }

  /**
   * Replace the old list with the current one.
   * @param items New list
   * @author: Carlos Rodríguez
   */
  createSeveral(items: T[]): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        this.storage.set(this.key, items);
        resolve(true);
      } catch {
        reject(false);
      }
    });
  }

  /**
   * Update list item.
   * @param id
   * @param item updated item
   */
  async update(id: number, item: T): Promise<boolean> {
    try {
      let items = await this.storage.get(this.key);
      if (items) {
        items = items.map((x) => {
          if (x.id == id) {
            return {
              ...item,
            };
          } else {
            return x;
          }
        });
      }
      this.storage.set(this.key, items);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove item from list.
   * @param id 
   */
  delete(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /**
   * Query a list of items.
   * @returns
   * @author: Carlos Rodríguez
   */
  async findAll(): Promise<ApiResponse<T[]>> {
    try {
      const items = await this.storage.get(this.key);
      if (items) {
        let response = new ApiResponse<T[]>(items.length, items, true, null);
        return response;
      }
      return null;
    } catch (error) {
      let response = new ApiResponse<T[]>(0, null, false, error);
      return response;
    }
  }

  /**
   * Query an item.
   * @param id
   * @author: Carlos Rodríguez
   */
  findOne(id: number): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      try {
        this.storage.get(this.key).then((result: T[]) => {
          if (result) {
            let items = result.filter((x: any) => x.id == id);
            if (items.length > 0) {
              let response = new ApiResponse<T>(
                items.length,
                items[0],
                true,
                null
              );
              resolve(response);
            }
            let response = new ApiResponse<T>(0, null, true, null);
            resolve(response);
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        let response = new ApiResponse<T>(0, null, false, error);
        reject(response);
      }
    });
  }
}
