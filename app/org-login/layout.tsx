import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization Login - PORTA",
  description: "Login to PORTA Organization Portal",
};

export default function OrgLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
