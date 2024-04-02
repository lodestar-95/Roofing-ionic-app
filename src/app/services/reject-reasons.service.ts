import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { RejectReasonsRepository } from '../db/reject-reasons.repository';
import { ApiResponse } from '../shared/interfaces/api-response';
import { RejectReason } from '../models/reject-reason.model';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';

@Injectable({
  providedIn: 'root'
})
export class RejectReasonsService {
  repository: RejectReasonsRepository;

  constructor(
    private storage: Storage,
    private networkService: NetworkValidateService
  ) {
    this.repository = new RejectReasonsRepository(this.storage, `reject-reasons`);
  }


  /**
   *
   * @returns
   * @author: Juan carrasco
   */
  getMockRejectReason(): Promise<ApiResponse<RejectReason[]>> {
    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        const mockRejectReason: RejectReason[] = [{
          reason: "Bid to high",
          id: 1
        },
        {
          reason: "Budgerting",
          id: 2
        },
        {
          reason: "Looker",
          id: 3
        },
        {
          reason: "Scheduling",
          id: 4
        },
        {
          reason: "Materials",
          id: 5
        },
        {
          reason: "Custom",
          id: 6
        },
        ]
        resolve({ count: 6, data: mockRejectReason, isSuccess: true, messagge: "OK" })
      } else {
        resolve(null);
      }
    });
  }

}
