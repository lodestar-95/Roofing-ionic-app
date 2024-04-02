import { CustomerType } from './customer-type.model';
import { Customer } from './customer.model';
import { Email } from './email.model';
import { LeadType } from './lead-type.model';
import { Phone } from './phone.model';

export interface Contact {
  id_contact: number;
  first_name: string;
  last_name: string;
  id_contact_type: number;
  phones: Phone[];
  phone: string;
  emails: Email[];
  id_lead_type?: number;
  lead_type?: LeadType;
  id_customer?: number;
  customer: Customer;
  id_customer_type?: number;
  customer_type?: CustomerType;
}
