import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <DashboardShell
      user={{
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}
