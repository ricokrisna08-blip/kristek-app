import type { Role } from "../domain/types";

export function homeRouteForRole(role: Role): string {
  return `/home/${role}`;
}
