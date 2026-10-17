import { Dashboard } from "@/components/admin/dashboard";
import { LoginScreen } from "@/components/admin/login-screen";
import { isAdmin } from "@/lib/server/auth";
import { listResponses } from "@/lib/server/db";

export default async function ResponsesPage() {
  if (!(await isAdmin())) return <LoginScreen />;
  const { responses, loadedAt } = listResponses();
  return <Dashboard responses={responses} loadedAt={loadedAt} />;
}
