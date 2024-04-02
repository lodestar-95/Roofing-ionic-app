import { User } from 'src/app/models/user.model';

export interface AuthModel {
  count: number;
  data: Data;
  isSuccess: boolean;
  messagge: string;
}

interface Data {
  user: User;
  token: string;
  refreshToken: string;
}
