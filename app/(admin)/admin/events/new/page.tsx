import type { Metadata } from "next";
import Link from "next/link";
import { prisma, isDbConfigured } from "@/lib/db";
import { PageTitle, SetupNotice } from "@/components/app/shell";
import { EventForm } from "@/components/forms/event-form";
import { Block } from "@/components/ui/block";

export const metadata: Metadata = { title: "New event", robots: { index: false } };

export default async function NewEventPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const [colleges, companies] = await Promise.all([
    prisma.college.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <Link
        href="/admin/events"
        className="mono mb-6 inline-block text-eyebrow underline underline-offset-4"
      >
        ← All events
      </Link>

      <PageTitle
        title="New event"
        sub="Save as a draft first — nothing is visible publicly until you move it to Announced or Registration open."
      />

      <div className="grid gap-8 lg:grid-cols-[3fr_1fr]">
        <EventForm colleges={colleges} companies={companies} />

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Block color="blue" className="p-5">
            <p className="mono mb-3 text-eyebrow">Order of operations</p>
            <ol className="flex flex-col gap-2 text-[14px]">
              {[
                "Save as DRAFT",
                "Add prizes on the edit page",
                "Move to ANNOUNCED so the page goes live",
                "Move to REGISTRATION_OPEN when you're ready to take money",
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="mono text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Block>
        </aside>
      </div>
    </>
  );
}
