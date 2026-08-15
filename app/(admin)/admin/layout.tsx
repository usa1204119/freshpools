import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app/shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/scoring", label: "Scoring" },
  { href: "/admin/talent", label: "Talent" },
  { href: "/admin/requirements", label: "Requirements" },
  { href: "/admin/intros", label: "Intros" },
  { href: "/admin/colleges", label: "Colleges" },
  { href: "/admin/companies", label: "Companies" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    /* Nine destinations — a sidebar, not a scrolling strip. */
    <AppShell nav={NAV} areaLabel="Admin" userName={session.user.name} layout="sidebar">
      {children}
    </AppShell>
  );
}
