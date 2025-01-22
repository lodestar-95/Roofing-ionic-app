import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Resource } from '../models/resource.model';
import { ApiResponse } from '../shared/interfaces/api-response';
import { ResourcesRepository } from '../db/resources.respository';
@Injectable({
  providedIn: 'root',
})
/**
 * @author: Carlos Rodríguez
 */
export class DocusignService {
  resorceRepository: ResourcesRepository;
  private url = environment.url;

  constructor(
    private http: HttpClient,
  ) {
    // this.jobTypeRepository = new JobTypesRepository(this.storage, `job_types`);
  }

  /**
   * Get the menu resources
   *
   * @returns
   */

  async createDocument(data): Promise<ApiResponse<Resource[]>> {
    const url = 'http://localhost:8000/api';
    return new Promise((resolve, reject) => {
      this.http
      .post<any>(`${this.url}/docusign/create`, data)
      .subscribe(
        async result => {
          if (result) {
            console.log(result);
            resolve(result);
          } else {
            resolve(null);
          }
        },
        error => reject(error)
      );
    });
  }
}
