import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '../shared/interfaces/api-response';
import { ProjectNote } from '../models/project-note.model';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private url = environment.url;

  constructor(
    private http: HttpClient,
    private readonly networkService: NetworkValidateService
  ) {}

  /**
   * Gets new project notes
   * @param id
   * @returns
   */
  getNotesByProject(id: number): Promise<ApiResponse<ProjectNote[]>> {
    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .get<ApiResponse<ProjectNote[]>>(
            `${this.url}/notes/getNotesByProject/${id}`
          )
          .subscribe(
            (result) => {
              resolve(result);
            },
            (error) => reject(error)
          );
      } else {
        resolve(null);
      }
    });
  }
}
