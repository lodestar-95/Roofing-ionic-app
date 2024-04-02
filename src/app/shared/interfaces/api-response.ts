export class ApiResponse<T> {
  count: number;
  data: T;
  isSuccess: boolean;
  messagge?: any;

  constructor(count, data, isSuccess, messagge) {
    this.count = count;
    this.data = data;
    this.isSuccess = isSuccess;
    this.messagge = messagge;
  }
}
