import { homeRouteForRole } from "../routes";

test("routes Pemilik to the Pemilik home screen", () => {
  expect(homeRouteForRole("pemilik")).toBe("/home/pemilik");
});

test("routes Admin to the Admin home screen", () => {
  expect(homeRouteForRole("admin")).toBe("/home/admin");
});

test("routes Teknisi to the Teknisi home screen", () => {
  expect(homeRouteForRole("teknisi")).toBe("/home/teknisi");
});
