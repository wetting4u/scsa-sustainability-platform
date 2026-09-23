export type HouseholdInitializationRow = {
  user_id: string;
  share_analytics: boolean;
  display_leaderboard: boolean;
};

export type AccountRoleInitializationRow = {
  user_id: string;
  role: string;
};

export type AccountInitializationStatus = {
  ready: boolean;
  checks: {
    profileExists: boolean;
    roleExists: boolean;
    householdRole: boolean;
    analyticsPrivate: boolean;
    leaderboardPrivate: boolean;
  };
};

export function inspectAccountInitialization(
  userId: string,
  profile: HouseholdInitializationRow | null,
  role: AccountRoleInitializationRow | null,
): AccountInitializationStatus {
  const profileExists = profile?.user_id === userId;
  const roleExists = role?.user_id === userId;
  const householdRole = roleExists && role?.role === "household";
  const analyticsPrivate = profileExists && profile?.share_analytics === false;
  const leaderboardPrivate =
    profileExists && profile?.display_leaderboard === false;

  const checks = {
    profileExists,
    roleExists,
    householdRole,
    analyticsPrivate,
    leaderboardPrivate,
  };

  return {
    ready: Object.values(checks).every(Boolean),
    checks,
  };
}
