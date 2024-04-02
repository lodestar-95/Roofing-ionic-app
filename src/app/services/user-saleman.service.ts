import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ApiResponse } from 'src/app/shared/interfaces/api-response';
import { UserSaleman } from 'src/app/models/user-saleman.model';
import { UserSalemanRepository } from '../db/users.saleman.repository';

@Injectable({
  providedIn: 'root'
})
export class UserSalemanService {
  repository: UserSalemanRepository;
  constructor(
    private storage: Storage
  ) {
    this.repository = new UserSalemanRepository(this.storage, `users`);
  }

  async loadUserSalemans(userSaleman: UserSaleman[]) {
    this.repository.createSeveral(userSaleman);
  }

  getProspectingTypesAll(): Promise<ApiResponse<UserSaleman[]>> {
    return new Promise((resolve, reject) => {
      this.repository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

}
