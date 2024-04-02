import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { AuthModel } from 'src/app/login/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private storage: Storage) {}

  async init() {
    await this.storage.create();
  }

  // Add
  async addUser(auth: AuthModel, password) {
    let userData: any = auth.data.user;
    userData.last_access_date = new Date();
    userData.password = password;
    let users = await this.getUserAll();
    users = users ? users : [];
    users.push(userData);
    this.storage.set('user', users);
  }

  // Edit
  async updateUser(username: string, password: string, idRole?: string) {
    let users = await this.getUserAll();
    users = users ? users : [];
    users.forEach((user) => {
      if (
        user.username == username && idRole
          ? user.roles[0].id_role == idRole
          : user.password == password
      ) {
        user.last_access_date = new Date();
        user.password = password;
      }
    });
    this.storage.set('user', users);
  }

  // Get all object
  getUserAll(): Promise<any> {
    return this.storage.get('user').then((response) => {
      return response;
    });
  }

  //Add Tokens
  async addUserTokens(token: string, refreshToken: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Delete
  async deleteUserTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  // Get single object
  async getUser(username: string, password: string): Promise<any> {
    return this.storage.get('user').then((response) => {
      const userList: any[] = response;
      if (userList && userList.length > 0) {
        const user = userList.find(
          (user) => user?.username == username && user?.password == password
        );
        return user;
      } else {
        return undefined;
      }
    });
  }

  async getUserByRole(username: string, idRole: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.storage.get('user').then((response) => {
          const userList: any[] = response;
          if (userList && userList.length > 0) {
            const user = userList.find(
              (user) =>
                user?.username == username && user?.roles[0].id_role == idRole
            );
            resolve(user);
          } else {
            resolve(null);
          }
        });
      } catch {
        reject(null);
      }
    });
  }
}
