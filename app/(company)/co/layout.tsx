import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app/shell";

const NAV: NavItem[] = [
  { href: "/co", label: "Dashboard" },
  { href: "/co/requirements", label: "Requirements" },
  { href: "/co/talent", label: "Talent" },
  { href: "/co/shortlist", label: "Shortlist" },
  { href: "/co/pipeline", label: "Pipeline" },
];

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/co");
  if (session.user.role !== "COMPANY") redirect("/");

  return (
    <AppShell nav={NAV} areaLabel="Company" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
