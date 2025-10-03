import { APIError } from '@/lib/result';

export interface IAuthState {
  error?: APIError
  ok: boolean
}

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
