export type SafeUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSuccessResponse = {
  user: SafeUser;
  accessToken: string;
};

export type MeResponse = {
  user: SafeUser;
};
