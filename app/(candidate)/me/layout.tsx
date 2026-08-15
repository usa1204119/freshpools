import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app/shell";

const NAV: NavItem[] = [
  { href: "/me", label: "Dashboard" },
  { href: "/me/hackathons", label: "My events" },
  { href: "/me/opportunities", label: "Opportunities" },
  { href: "/me/profile", label: "Profile" },
];

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/me");
  if (session.user.role !== "CANDIDATE") redirect("/");

  return (
    <AppShell nav={NAV} areaLabel="Candidate" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
