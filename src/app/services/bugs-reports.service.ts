import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '../shared/interfaces/api-response';
import { ProjectNote } from '../models/project-note.model';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';
import { BugReport } from '../models/bug-report.model';

export interface BugsReport {
    proposal: string;
    action: string;
    description: string;
    localStorageCopy: string;
    localDBCopy: string;
}
export interface JiraBugsReport {
  proposal: string;
  action: string;
  description: string;
  localStorageCopy: string;
  caption?: string;
}

export interface JiraIssue {
id: string;
key: string;
self: string;
}

@Injectable({
  providedIn: 'root',
})
export class BugsReportsService {
  private url = environment.url;
  constructor(
    private http: HttpClient,
    private readonly networkService: NetworkValidateService
  ) {}

  /**
   * Gets list of bugs reports
   *
   * @returns
   */
  list(offset): Promise<ApiResponse<BugReport[]>> {
    const limit = 10;
    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .get<ApiResponse<BugReport[]>>(
            //`${this.url}/bugs-report/list?offset=${offset}&limit=${limit}`
            `http://localhost:8015/api/bugs-report/list?offset=${offset}&limit=${limit}`

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

  /**
   * Saves a bugs report
   *
   * @returns
   */
  save(bugsReport: BugsReport): Promise<ApiResponse<ProjectNote[]>> {
    const body = {
        ...bugsReport,
        token: btoa(`${environment.jiraUsername}:${environment.jiraPassword}`)
    };

    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .post<ApiResponse<ProjectNote[]>>(
            `${this.url}/bugs-report/save`,
            // `http://localhost:8000/api/bugs-report/save`,
            body,
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


    /**
     * Saves a bugs report
     *
     * @returns
     */
    async saveJiraIssue(bugsReport: JiraBugsReport): Promise<JiraIssue> {
      const form = new FormData();

      form.append('file', bugsReport.caption);
      form.append('description', bugsReport.description);
      form.append('action', bugsReport.action);
      form.append('proposal', bugsReport.proposal);
      form.append('localStorageCopy', bugsReport.localStorageCopy);

      return new Promise((resolve, reject) => {
        if (this.networkService.isConnected) {
          this.http
            .post<JiraIssue>(
              `${this.url}/jira/issue`,
              form
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
