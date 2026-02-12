import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OrgLayoutClient } from "./layout-client";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  const session = JSON.parse(sessionCookie.value);
  if (session.expires_at < Date.now()) return null;
  return session;
}

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const session = await getOrgSession();

  if (!session) {
    redirect("/org-login");
  }

  return (
    <OrgLayoutClient session={session}>
      {children}
    </OrgLayoutClient>
  );
}
