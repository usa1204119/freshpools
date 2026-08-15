import { auth, DASHBOARD_BY_ROLE } from "@/lib/auth";
import { Nav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";

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
      <Nav dashboardHref={dashboardHref} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
