import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Eyebrow, MixedHeadline } from "@/components/marketing/mixed-headline";
import { StatusBadge } from "@/components/ui/status-badge";
import { Block } from "@/components/ui/block";
import { getLeaderboard } from "@/lib/queries";
import { formatDateRange } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLeaderboard(slug);
  if (!data) return { title: "Results not found" };
  return {
    title: `${data.event.title} — results`,
    description: `Final standings, demo videos and repositories from ${data.event.title}.`,
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getLeaderboard(slug);
  if (!data) notFound();

  const { event, rows } = data;

  return (
    <>
      <section className="border-b border-line-soft wash-soft">
        <div className="container-x py-16 lg:py-20">
          <Eyebrow className="mb-6">Results</Eyebrow>
          <MixedHeadline
            text={`**${event.title}**`}
            as="h1"
            size="h1"
            className="max-w-[18ch]"
          />
          <p className="mono mt-6 text-label text-ink-muted">
            {formatDateRange(event.startAt, event.endAt)}
          </p>
          <Link
            href={`/hackathons/${slug}`}
            className="mono mt-6 inline-block text-label underline underline-offset-4"
          >
            ← Back to the event
          </Link>
        </div>
      </section>

      <section className="section-y bg-paper">
        <div className="container-x">
          {rows.length === 0 ? (
            <Block color="white" className="p-10">
              <p className="hl-serif text-[22px] text-ink-muted">
                Judging is still in progress. Results go up here as soon as every
                viva is done.
              </p>
            </Block>
          ) : (
            <>
              {/* Scores stay private — rank is the only number we publish. */}
              <p className="mono mb-6 text-eyebrow text-ink-muted">
                Rank only · individual scores are not published
              </p>

              <div className="overflow-x-auto rounded-lg border border-line-soft">
                <table className="w-full min-w-[720px] border-collapse bg-block-white text-left">
                  <caption className="sr-only">
                    Final standings for {event.title}
                  </caption>
                  <thead>
                    <tr className="border-b border-line-mid">
                      {["Rank", "Team", "Project", "Stack", "Links"].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="mono px-4 py-3 text-eyebrow text-ink-muted"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.teamId} className="border-b border-line-soft last:border-b-0">
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <span className="font-sans text-[22px] font-bold tabular-nums">
                              {String(row.rank).padStart(2, "0")}
                            </span>
                            {row.rank !== null && row.rank <= 10 ? (
                              <StatusBadge tone="done">Verified</StatusBadge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top font-medium">
                          {row.teamName}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {row.title}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <ul className="flex flex-wrap gap-1.5">
                            {row.stack.map((tech) => (
                              <li
                                key={tech}
                                className="mono rounded-sm border border-line-mid px-1.5 py-0.5 text-eyebrow"
                              >
                                {tech}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            {row.videoUrl ? (
                              <a
                                href={row.videoUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mono text-eyebrow underline underline-offset-4"
                              >
                                Demo video ↗
                              </a>
                            ) : null}
                            {row.repoUrl ? (
                              <a
                                href={row.repoUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mono text-eyebrow underline underline-offset-4"
                              >
                                Repository ↗
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
