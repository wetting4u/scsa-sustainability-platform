import "server-only";

import { requireAdmin } from "@/features/admin/server/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateCreateAdminUser,
  validateUpdateAdminUser,
  type AdminManagedUser,
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

function getAdminClient() {
  try {
    return {
      ok: true as const,
      client: createAdminClient(),
    };
  } catch {
    return {
      ok: false as const,
      response: apiError(
        503,
        "ADMIN_SERVICE_UNAVAILABLE",
        "Administrator account management is not configured.",
      ),
    };
  }
}

export async function listAdminUsers() {
  const authorization = await requireAdmin();

  if (!authorization.ok) {
    return authorization.response;
  }

  const adminResult = getAdminClient();

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const admin = adminResult.client;

  const { data: authData, error: usersError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (usersError) {
    return apiError(500, "USERS_QUERY_FAILED", "Unable to load users.");
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
    admin.from("account_roles").select("user_id, role").in("user_id", userIds),
  ]);

  if (profilesResult.error || rolesResult.error) {
    return apiError(
      500,
      "USER_DETAILS_QUERY_FAILED",
      "Unable to load user details.",
    );
  }

  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );

  const roles = new Map(
    (rolesResult.data ?? []).map((roleRecord) => [
      roleRecord.user_id,
      roleRecord.role,
    ]),
  );

  const users: AdminManagedUser[] = authUsers.map((user) => {
    const profile = profiles.get(user.id);
    const bannedUntil = user.banned_until ? Date.parse(user.banned_until) : 0;

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

  if (!authorization.ok) {
    return authorization.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid user information.");
  }

  const validation = validateCreateAdminUser(body);

  if (validation.error) {
    return apiError(400, validation.error.code, validation.error.message);
  }

  const input = validation.data;

  const adminResult = getAdminClient();

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const admin = adminResult.client;

  const { data, error: createError } = await admin.auth.admin.createUser({
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

  const { data: profile, error: profileError } = await admin
    .from("household_profiles")
    .update({
      display_name: input.householdName,
      household_size: input.householdSize,
    })
    .eq("user_id", data.user.id)
    .select("user_id")
    .maybeSingle();

  if (profileError || !profile) {
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
export async function updateAdminUser(request: Request, userId: string) {
  const authorization = await requireAdmin();

  if (!authorization.ok) {
    return authorization.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid user information.");
  }

  const validation = validateUpdateAdminUser(body);

  if (validation.error) {
    return apiError(400, validation.error.code, validation.error.message);
  }

  const { email, householdName, householdSize, disabled } = validation.data;

  const adminResult = getAdminClient();

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const admin = adminResult.client;

  const { data: targetData, error: targetError } =
    await admin.auth.admin.getUserById(userId);

  if (targetError || !targetData.user) {
    return apiError(404, "USER_NOT_FOUND", "User not found.");
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
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email,
    });

    if (error) {
      const duplicateEmail = error.message.toLowerCase().includes("already");

      return apiError(
        duplicateEmail ? 409 : 500,
        duplicateEmail ? "EMAIL_ALREADY_EXISTS" : "EMAIL_UPDATE_FAILED",
        duplicateEmail
          ? "A user with this email address already exists."
          : "Unable to update the user email.",
      );
    }
  }

  if (disabled !== undefined) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? "876000h" : "none",
    });

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
    const { data: profile, error } = await admin
      .from("household_profiles")
      .update(profileChanges)
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();

    if (error) {
      return apiError(
        500,
        "PROFILE_UPDATE_FAILED",
        "Unable to update the household profile.",
      );
    }

    if (!profile) {
      return apiError(404, "PROFILE_NOT_FOUND", "Household profile not found.");
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

  if (!authorization.ok) {
    return authorization.response;
  }

  if (authorization.userId === userId) {
    return apiError(
      400,
      "CANNOT_DELETE_SELF",
      "You cannot delete your own administrator account.",
    );
  }

  const adminResult = getAdminClient();

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const admin = adminResult.client;

  const { data: targetData, error: targetError } =
    await admin.auth.admin.getUserById(userId);

  if (targetError || !targetData.user) {
    return apiError(404, "USER_NOT_FOUND", "User not found.");
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
      error.status === 404 ? "USER_NOT_FOUND" : "USER_DELETE_FAILED",
      error.status === 404 ? "User not found." : "Unable to delete the user.",
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
