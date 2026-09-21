import { Icon, PageHeading } from "@/components/ui";
import { challenges } from "@/mocks/data";

export default function AdminChallengesPage() {
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Manage challenges."
        description="Review the sustainability challenges available to households."
      />

      <div className="notice">
        <Icon name="shield" />
        Challenge editing and creation will be connected to the database API
        in the next stage.
      </div>

      <div className="three-grid">
        {challenges.map((challenge) => (
          <article className="panel" key={challenge.id}>
            <Icon name="challenges" size={30} />
            <div className="eyebrow">{challenge.tag}</div>
            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>
            <p>
              <strong>
                {challenge.start} — {challenge.end}
              </strong>
            </p>
            <small>Current challenge data · Management controls planned</small>
          </article>
        ))}
      </div>
    </>
  );
}