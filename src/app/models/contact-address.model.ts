import { Contact } from './contact.model';
import { CountryState } from './country-state.model';
import { Customer } from './customer.model';

export interface ContactAddress {
  id_contact_address: number;
  address: string;
  city: string;
  id_country_state: number;
  country_state: CountryState;
  id_contact: number;
  customer: Customer;
  contact: Contact;
}
