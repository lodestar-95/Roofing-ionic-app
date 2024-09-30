import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';
import { Dropbox, DropboxResponse, Error, files } from 'dropbox';
@Injectable({
  providedIn: 'root'
})
export class DropboxApiService {
  private appKey = environment.appKey;
  private appSecret = environment.appSecret;
  private refreshToken = environment.refreshToken;
  private dbx: Dropbox;

  constructor(private readonly networkService: NetworkValidateService) {
    this.dbx = new Dropbox({
      clientId: this.appKey,
      clientSecret: this.appSecret,
      refreshToken: this.refreshToken
    });
  }

  /**
   * This Service connnect to dropbox and upload a file
   * @param name client
   * @param domicile client address
   * @param file File to upload
   * @returns
   */
  async uploadFile(
    projectName: string,
    projectDomicile: string,
    file: File
  ): Promise<DropboxResponse<files.FileMetadata>> {
    if (!this.networkService.isConnected) {
      throw new Error('No network connection');
    }
  
    try {
      const basePath = "";//`/E & H Roofing Team/E&H Roofing/App/2022`;
      const projectPath = `${basePath}/${projectName}`;
      const finalPath = `${projectPath}/${projectDomicile}`;
  
      // Crear carpeta del proyecto si no existe
      //await this.createFolderIfNeeded(projectPath);
  
      // Crear carpeta del identificador si no existe
      //await this.createFolderIfNeeded(finalPath);
  
      // Ahora que las carpetas están aseguradas, sube el archivo
      console.log(`Subir archivo a Carpeta: ${finalPath}`);
      const response = await this.dbx.filesUpload({ path: `${finalPath}/${file.name}`, contents: file });
      console.log('Archivo subido con éxito', response);
      return response;
    } catch (error) {
      console.error('Error al subir archivo', error);
      throw error; // Esto permitirá que el error sea capturado por el llamador de la función
    }
  }

  async createFolderIfNeeded(path: string): Promise<void> {
    try {
        console.log(`Crear Carpeta: ${path}`);
      await this.dbx.filesCreateFolderV2({ path });
      console.log(`Carpeta creada: ${path}`);
    } catch (error) {
      if (error.error && error.error.error_summary.startsWith('path/conflict/folder/')) {
        console.log(`La carpeta ya existe: ${path}`);
        // La carpeta ya existe, maneja este caso como necesario
      } else {
        // Otro tipo de error
        console.error(`Error al crear la carpeta ${path}:`, error);
        throw error;
      }
    }
  }
}
