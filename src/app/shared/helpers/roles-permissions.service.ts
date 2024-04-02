import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { Project } from 'src/app/models/project.model';
import { User } from 'src/app/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RolesPermissionsService {
  user: User;
  constructor(
    private auth: AuthService,
  ) { }

  validateUserPermision(projectStatus: number, projectUserSaleman: number, project: Project ): Promise<boolean> {
    const activeVersion = project.versions.find((x) => x.active);
    const { is_current_version } = activeVersion ?? {};
    return new Promise((resolve, reject) => {
    this.auth.getAuthUser().then((user) => {
      this.user = user;
      if(this.user.role.id_role === '1' || this.user.role.id_role === '2'){
        if(this.user.id !== projectUserSaleman){
          resolve(true);
        }
      }else if(this.user.role.id_role === '3'){
        if(projectStatus === 5 || projectStatus === 4){
          resolve(true);
        }
        if(!is_current_version){
           resolve(true);
        }
      }else{
        resolve(false);
      }
      resolve(false);
    });
   });
  }
}
