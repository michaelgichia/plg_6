export interface IAuthState {
  message: string | null
  success: boolean
}

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};