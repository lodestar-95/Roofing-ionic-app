import { Contact } from './contact.model';

export interface UserSaleman {
  id_user: number;
  id_contact: number;
  contact?: Contact;
  id_role: number;
  modification_date?: any;
  login_online_date?: any;
  createdAt?: any;
  updatedAt?: string;
  deletedAt?: any;
}
