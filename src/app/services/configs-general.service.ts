import { Injectable } from '@angular/core';
import { ProjectsRepository } from '../db/projects.respository';
import { Storage } from '@ionic/storage';
import { General } from 'src/app/models/general.model';
import { GeneralRepository } from '../db/general.repository';
import { ApiResponse } from 'src/app/shared/interfaces/api-response';

@Injectable({
  providedIn: 'root',
})
export class ConfigsGeneralService {
  repository: GeneralRepository;

  constructor(private storage: Storage) {
    this.repository = new GeneralRepository(this.storage, `general`);
  }

  // async loadConfigs(generals: General[]) {
  //   this.repository.createSeveral(generals);
  // }

  getConfig(id: number): Promise<ApiResponse<General>> {
    return new Promise((resolve, reject) => {
      // if (this.networkService.isConnected) {
      if (false) {
        reject(null);
        console.warn('getProgect no esta implementado en online.');
      } else {
        this.repository.findOne(id).then(
          (result) => resolve(result),
          (error) => reject(error)
        );
      }
    });
  }

  getConfigByKey(key: string): Promise<General> {
    return new Promise((resolve, reject) => {
      // if (this.networkService.isConnected) {
      if (false) {
        reject(null);
        console.warn('getProgect no esta implementado en online.');
      } else {
        this.repository.findAll().then(
          (result) => {
            const datas = [...result.data];
            const x = datas.find((x) => x.key === key);

            resolve(x);
          },
          (error) => reject(error)
        );
      }
    });
  }
}
