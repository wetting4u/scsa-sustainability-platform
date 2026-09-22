import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminManagedUser,
  CreateAdminUserInput,
} from "../domain";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function apiError(status: number, code: string, message: string) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

async function requireAdmin(): Promise<
  { userId: string } | Response
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before managing users.",
    );
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    return apiError(
      500,
      "ROLE_CHECK_FAILED",
      "Unable to verify administrator access.",
    );
  }

  if (roleRecord?.role !== "admin") {
    return apiError(
      403,
      "FORBIDDEN",
      "Administrator access is required.",
    );
  }

  return {
    userId: user.id,
  };
}

export async function listAdminUsers() {
  const authorization = await requireAdmin();

  if (authorization instanceof Response) {
    return authorization;
  }

  const admin = createAdminClient();

  const { data: authData, error: usersError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (usersError) {
    return apiError(
      500,
      "USERS_QUERY_FAILED",
      "Unable to load users.",
    );
  }

  const authUsers = authData.users;

  if (!authUsers.length) {
    return Response.json(
      { data: [] satisfies AdminManagedUser[] },
      {
        status: 200,
        headers: noStoreHeaders,
      },
    );
  }

  const userIds = authUsers.map((user) => user.id);

  const [profilesResult, rolesResult] = await Promise.all([
    admin
      .from("household_profiles")
      .select("user_id, display_name, household_size")
      .in("user_id", userIds),
    admin
      .from("account_roles")
      .select("user_id, role")
      .in("user_id", userIds),
  ]);

  if (profilesResult.error || rolesResult.error) {
    return apiError(
      500,
      "USER_DETAILS_QUERY_FAILED",
      "Unable to load user details.",
    );
  }

  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );

  const roles = new Map(
    (rolesResult.data ?? []).map((roleRecord) => [
      roleRecord.user_id,
      roleRecord.role,
    ]),
  );

  const users: AdminManagedUser[] = authUsers.map((user) => {
    const profile = profiles.get(user.id);
    const bannedUntil = user.banned_until
      ? Date.parse(user.banned_until)
      : 0;

    return {
      id: user.id,
      email: user.email ?? "",
      householdName: profile?.display_name ?? "",
      householdSize: Number(profile?.household_size ?? 1),
      role: roles.get(user.id) === "admin" ? "admin" : "household",
      status: bannedUntil > Date.now() ? "disabled" : "active",
      createdAt: user.created_at,
    };
  });

  users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return Response.json(
    { data: users },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
export async function createAdminUser(request: Request) {
  const authorization = await requireAdmin();

  if (authorization instanceof Response) {
    return authorization;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      400,
      "INVALID_JSON",
      "Enter valid user information.",
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(
      400,
      "INVALID_USER",
      "Enter valid user information.",
    );
  }

  const values = body as Record<string, unknown>;

  const input: CreateAdminUserInput = {
    email: String(values.email ?? "").trim().toLowerCase(),
    password: String(values.password ?? ""),
    householdName: String(values.householdName ?? "").trim(),
    householdSize: Number(values.householdSize),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return apiError(
      400,
      "INVALID_EMAIL",
      "Enter a valid email address.",
    );
  }

  const passwordIsValid =
    input.password.length >= 8 &&
    /[a-z]/.test(input.password) &&
    /[A-Z]/.test(input.password) &&
    /[^A-Za-z0-9]/.test(input.password);

  if (!passwordIsValid) {
    return apiError(
      400,
      "INVALID_PASSWORD",
      "Password must contain at least 8 characters, uppercase and lowercase letters, and a special character.",
    );
  }

  if (!input.householdName || input.householdName.length > 60) {
    return apiError(
      400,
      "INVALID_HOUSEHOLD_NAME",
      "Enter a household name of no more than 60 characters.",
    );
  }

  if (
    !Number.isInteger(input.householdSize) ||
    input.householdSize < 1 ||
    input.householdSize > 20
  ) {
    return apiError(
      400,
      "INVALID_HOUSEHOLD_SIZE",
      "Household size must be between 1 and 20.",
    );
  }

  const admin = createAdminClient();

  const { data, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

  if (createError || !data.user) {
    const duplicateEmail =
      createError?.message.toLowerCase().includes("already") ?? false;

    return apiError(
      duplicateEmail ? 409 : 500,
      duplicateEmail ? "EMAIL_ALREADY_EXISTS" : "USER_CREATE_FAILED",
      duplicateEmail
        ? "A user with this email address already exists."
        : "Unable to create the user.",
    );
  }

  const { error: profileError } = await admin
    .from("household_profiles")
    .update({
      display_name: input.householdName,
      household_size: input.householdSize,
    })
    .eq("user_id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);

    return apiError(
      500,
      "PROFILE_CREATE_FAILED",
      "Unable to create the household profile.",
    );
  }

  const createdUser: AdminManagedUser = {
    id: data.user.id,
    email: data.user.email ?? input.email,
    householdName: input.householdName,
    householdSize: input.householdSize,
    role: "household",
    status: "active",
    createdAt: data.user.created_at,
  };

  return Response.json(
    {
      data: createdUser,
    },
    {
      status: 201,
      headers: noStoreHeaders,
    },
  );
}
export async function updateAdminUser(
  request: Request,
  userId: string,
) {
  const authorization = await requireAdmin();

  if (authorization instanceof Response) {
    return authorization;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      400,
      "INVALID_JSON",
      "Enter valid user information.",
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(
      400,
      "INVALID_USER_UPDATE",
      "Enter valid user information.",
    );
  }

  const values = body as Record<string, unknown>;

  const email =
    values.email === undefined
      ? undefined
      : String(values.email).trim().toLowerCase();

  const householdName =
    values.householdName === undefined
      ? undefined
      : String(values.householdName).trim();

  const householdSize =
    values.householdSize === undefined
      ? undefined
      : Number(values.householdSize);

  const disabled =
    values.disabled === undefined
      ? undefined
      : values.disabled;

  if (
    email === undefined &&
    householdName === undefined &&
    householdSize === undefined &&
    disabled === undefined
  ) {
    return apiError(
      400,
      "NO_CHANGES",
      "No user changes were provided.",
    );
  }

  if (
    email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return apiError(
      400,
      "INVALID_EMAIL",
      "Enter a valid email address.",
    );
  }

  if (
    householdName !== undefined &&
    (!householdName || householdName.length > 60)
  ) {
    return apiError(
      400,
      "INVALID_HOUSEHOLD_NAME",
      "Enter a household name of no more than 60 characters.",
    );
  }

  if (
    householdSize !== undefined &&
    (!Number.isInteger(householdSize) ||
      householdSize < 1 ||
      householdSize > 20)
  ) {
    return apiError(
      400,
      "INVALID_HOUSEHOLD_SIZE",
      "Household size must be between 1 and 20.",
    );
  }

  if (disabled !== undefined && typeof disabled !== "boolean") {
    return apiError(
      400,
      "INVALID_STATUS",
      "Enter a valid user status.",
    );
  }

  const admin = createAdminClient();

  const { data: targetData, error: targetError } =
    await admin.auth.admin.getUserById(userId);

  if (targetError || !targetData.user) {
    return apiError(
      404,
      "USER_NOT_FOUND",
      "User not found.",
    );
  }

  const { data: roleRecord, error: roleError } = await admin
    .from("account_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError) {
    return apiError(
      500,
      "ROLE_QUERY_FAILED",
      "Unable to verify the user role.",
    );
  }

  if (roleRecord?.role === "admin" && disabled === true) {
    return apiError(
      400,
      "PROTECTED_ADMIN",
      "The administrator account cannot be disabled.",
    );
  }

  if (email !== undefined) {
    const { error } = await admin.auth.admin.updateUserById(
      userId,
      {
        email,
      },
    );

    if (error) {
      return apiError(
        500,
        "EMAIL_UPDATE_FAILED",
        "Unable to update the user email.",
      );
    }
  }

  if (disabled !== undefined) {
    const { error } = await admin.auth.admin.updateUserById(
      userId,
      {
        ban_duration: disabled ? "876000h" : "none",
      },
    );

    if (error) {
      return apiError(
        500,
        "STATUS_UPDATE_FAILED",
        "Unable to update the user status.",
      );
    }
  }

  const profileChanges: {
    display_name?: string;
    household_size?: number;
  } = {};

  if (householdName !== undefined) {
    profileChanges.display_name = householdName;
  }

  if (householdSize !== undefined) {
    profileChanges.household_size = householdSize;
  }

  if (Object.keys(profileChanges).length > 0) {
    const { error } = await admin
      .from("household_profiles")
      .update(profileChanges)
      .eq("user_id", userId);

    if (error) {
      return apiError(
        500,
        "PROFILE_UPDATE_FAILED",
        "Unable to update the household profile.",
      );
    }
  }

  return Response.json(
    {
      data: {
        id: userId,
      },
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
export async function deleteAdminUser(userId: string) {
  const authorization = await requireAdmin();

  if (authorization instanceof Response) {
    return authorization;
  }

  if (authorization.userId === userId) {
    return apiError(
      400,
      "CANNOT_DELETE_SELF",
      "You cannot delete your own administrator account.",
    );
  }

  const admin = createAdminClient();

  const { data: roleRecord, error: roleError } = await admin
    .from("account_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError) {
    return apiError(
      500,
      "ROLE_QUERY_FAILED",
      "Unable to verify the user role.",
    );
  }

  if (roleRecord?.role === "admin") {
    return apiError(
      400,
      "PROTECTED_ADMIN",
      "The administrator account cannot be deleted.",
    );
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return apiError(
      error.status === 404 ? 404 : 500,
      error.status === 404
        ? "USER_NOT_FOUND"
        : "USER_DELETE_FAILED",
      error.status === 404
        ? "User not found."
        : "Unable to delete the user.",
    );
  }

  return Response.json(
    {
      data: {
        id: userId,
      },
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}