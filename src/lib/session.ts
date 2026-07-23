import { UserSession } from "@/Types/POSTypes";

const SESSION_KEY = "InventoryUser";

export function getCurrentUser(): UserSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>;
    if (!parsed || typeof parsed.username !== "string" || typeof parsed.role !== "string") {
      clearCurrentUser();
      return null;
    }

    return {
      id: parsed.id,
      username: parsed.username,
      role: parsed.role,
      name: parsed.name,
    };
  } catch {
    clearCurrentUser();
    return null;
  }
}

export function setCurrentUser(user: UserSession) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    }),
  );
}

export function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("auth_token");
}

export function userCanAccess(user: UserSession | null, roles: string[]) {
  return !!user && roles.includes(user.role);
}
