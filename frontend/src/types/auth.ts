export type SafeUser = {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSuccessResponse = {
  user: SafeUser;
  accessToken: string;
};

export type SignUpResponse = {
  user: SafeUser;
  message: string;
  verificationToken?: string;
};

export type MeResponse = {
  user: SafeUser;
};

export type MessageResponse = {
  message: string;
};
