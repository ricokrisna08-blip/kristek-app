import type { TiketStatus } from "./stateMachine/applyTiketEvent";

export type ProgressStepKey = "ditugaskan" | "dikerjakan" | "selesai";
export type ProgressStepState = "done" | "active" | "blocked" | "upcoming";

const STEP_ORDER: TiketStatus[] = ["baru", "ditugaskan", "dikerjakan", "selesai"];

export function tiketProgressStepState(
  status: TiketStatus,
  stepKey: ProgressStepKey
): ProgressStepState {
  const effectiveStatus = status === "pending" ? "dikerjakan" : status;
  const currentIndex = STEP_ORDER.indexOf(effectiveStatus);
  const stepIndex = STEP_ORDER.indexOf(stepKey);

  if (stepIndex < currentIndex) {
    return "done";
  }
  if (stepIndex === currentIndex) {
    return status === "pending" ? "blocked" : "active";
  }
  return "upcoming";
}
