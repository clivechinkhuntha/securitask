export type AuthenticatedUser = {
  id: string;
  externalAuthId: string;
  email: string;
  permissions: string[];
};
