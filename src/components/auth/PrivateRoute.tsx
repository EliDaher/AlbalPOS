import { Navigate } from "react-router-dom";
import { getCurrentUser, userCanAccess } from "@/lib/session";

export function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;

  if (userCanAccess(user, allowedRoles)) return <>{children}</>;
  return <Navigate to="/unauthorized" replace />;
}
