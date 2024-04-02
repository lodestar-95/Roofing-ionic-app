import { Contact } from "./contact.model";
import { CustomerType } from "./customer-type.model";
import { LeadType } from "./lead-type.model";

export interface Customer {
  id_customer: number;
  id_contact: number;
  contact: Contact;
  id_contact_referred: number;
  contact_referred: Contact;
  id_customer_type: number;
  customer_type: CustomerType;
  id_lead_type: number;
  lead_type: LeadType;
}
