import { Contact } from "./contact.model";
import { Role } from "./role.model";

export interface User {
  id?: number;
  username: string;
  role: Role;
  contact: Contact;
  id_inspector_type?: number;
  can_send_email: boolean;
}
