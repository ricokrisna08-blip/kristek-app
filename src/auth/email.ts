const INTERNAL_EMAIL_DOMAIN = "internal.kristek.app";

export function usernameToEmail(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}
