import { IQueryString } from '@interfaces/IQueryString.interface';

export interface IUserQueryString extends IQueryString {
  username?: string;
  email?: string;
  role?: string;
  transporter?: string;
  smtp?: string
}