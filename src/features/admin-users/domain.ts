export type AccountRole = "household" | "admin";

export type AdminManagedUser = {
  id: string;
  email: string;
  householdName: string;
  householdSize: number;
  role: AccountRole;
  status: "active" | "disabled";
  createdAt: string;
};

export type CreateAdminUserInput = {
  email: string;
  password: string;
  householdName: string;
  householdSize: number;
};

export type UpdateAdminUserInput = {
  email?: string;
  householdName?: string;
  householdSize?: number;
  disabled?: boolean;
};