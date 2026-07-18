export type UserRole = 'ADMIN' | 'MANAGER' | 'HUMAN_RESOURCES' | 'OPERATOR' | 'EMPLOYEE';

export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  active: boolean;
  roles: Role[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  password: string;
  roles: UserRole[]; // role NAMES, e.g. ["EMPLOYEE"] — matches Create User's documented shape
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  password?: string;
  roles?: { id: string }[]; // role IDs — different shape from Create User
  active?: boolean;
}
