import { usernameToEmail } from "../email";

test("maps a username to a deterministic internal email", () => {
  expect(usernameToEmail("teknisi01")).toBe("teknisi01@internal.kristek.app");
});
