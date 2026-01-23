export type UserRole = 'ADMIN' | 'OPERATOR';

export interface Profile {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
