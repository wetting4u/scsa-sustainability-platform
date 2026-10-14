import { redirect } from "next/navigation";

import { PageHeading, Icon } from "@/components/ui";
import { FrozenAccountActions } from "@/features/account/frozen-account-actions";
import { isAccountFrozen } from "@/features/auth/authorization";
import { requireAuthenticatedAccount } from "@/features/auth/server/authorization";

export const dynamic = "force-dynamic";

export default async function AccountFrozenPage() {
  const authorization = await requireAuthenticatedAccount();

  if (!authorization.ok) {
    redirect("/sign-in");
  }

  if (!isAccountFrozen(authorization.user.app_metadata)) {
    redirect("/overview");
  }

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT PAUSED"
        title="Your account is frozen."
        description="Your account and saved information are still here. Unfreeze your account whenever you are ready to continue."
      />

      <section className="panel">
        <Icon name="shield" size={36} />

        <h2>Your information has been kept.</h2>

        <p>
          Freezing your account pauses access to household features. It does not
          delete your profile, records, goals, Community Area, or privacy
          preferences.
        </p>

        <FrozenAccountActions />
      </section>
    </>
  );
}