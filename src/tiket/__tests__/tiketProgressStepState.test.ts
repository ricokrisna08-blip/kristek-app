import { tiketProgressStepState } from "../tiketProgressStepState";

test("a step before the current status is done", () => {
  expect(tiketProgressStepState("dikerjakan", "ditugaskan")).toBe("done");
});

test("the step matching the current status is active", () => {
  expect(tiketProgressStepState("dikerjakan", "dikerjakan")).toBe("active");
});

test("a step after the current status is upcoming", () => {
  expect(tiketProgressStepState("ditugaskan", "dikerjakan")).toBe("upcoming");
  expect(tiketProgressStepState("ditugaskan", "selesai")).toBe("upcoming");
});

test("Pending is treated as a blocked Dikerjakan step, not its own step", () => {
  expect(tiketProgressStepState("pending", "dikerjakan")).toBe("blocked");
  expect(tiketProgressStepState("pending", "ditugaskan")).toBe("done");
  expect(tiketProgressStepState("pending", "selesai")).toBe("upcoming");
});

test("Selesai marks every step as done", () => {
  expect(tiketProgressStepState("selesai", "ditugaskan")).toBe("done");
  expect(tiketProgressStepState("selesai", "dikerjakan")).toBe("done");
  expect(tiketProgressStepState("selesai", "selesai")).toBe("active");
});
