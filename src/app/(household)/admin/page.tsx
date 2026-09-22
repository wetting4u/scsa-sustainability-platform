import Link from "next/link";

import { Icon, PageHeading } from "@/components/ui";

export default function AdminPage() {
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Manage the SCSA platform."
        description="Review household accounts and maintain community challenges."
      />

      <div className="notice">
        <Icon name="shield" />
        Administrator tools are restricted to authorised accounts. Changes
        should be reviewed carefully.
      </div>

      <div className="two-grid">
        <section className="panel">
          <Icon name="community" size={30} />

          <h2>Household users</h2>

          <p>
            Review registered household accounts, account status and user
            information.
          </p>

          <Link href="/admin/users" className="button secondary">
            Manage users <Icon name="arrow" size={16} />
          </Link>
        </section>

        <section className="panel">
          <Icon name="challenges" size={30} />

          <h2>Community challenges</h2>

          <p>
            Review the challenges available to households and maintain their
            details.
          </p>

          <Link href="/admin/challenges" className="button secondary">
            Manage challenges <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}