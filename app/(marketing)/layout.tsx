import { auth, DASHBOARD_BY_ROLE } from "@/lib/auth";
import { Nav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";
import { ResumeBar } from "@/components/marketing/role-doors";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const dashboardHref = session?.user
    ? DASHBOARD_BY_ROLE[session.user.role]
    : null;

  return (
    <>
      {/* Signed-in visitors already have a Dashboard link in the nav, so the
          remembered-lane bar would only be noise for them. It also sits above
          the sticky nav, so it scrolls away rather than taking permanent
          vertical space. */}
      {dashboardHref ? null : <ResumeBar />}
      <Nav dashboardHref={dashboardHref} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
