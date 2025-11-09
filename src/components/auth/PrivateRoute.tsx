import { Navigate } from "react-router-dom";

export function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const userStr = localStorage.getItem("InventoryUser");
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles.includes(user.role)) {
      return <>{children}</>;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }
}
