import { StyleSheet, Text, View } from "react-native";
import type { TiketStatus } from "../tiket/stateMachine/applyTiketEvent";
import {
  tiketProgressStepState,
  type ProgressStepKey,
  type ProgressStepState,
} from "../tiket/tiketProgressStepState";

const STEPS: { key: ProgressStepKey; label: string }[] = [
  { key: "ditugaskan", label: "Ditugaskan" },
  { key: "dikerjakan", label: "Dikerjakan" },
  { key: "selesai", label: "Selesai" },
];

const COLOR_BY_STATE: Record<ProgressStepState, string> = {
  done: "#16a34a",
  active: "#2563eb",
  blocked: "#d97706",
  upcoming: "#d1d5db",
};

type Props = {
  status: TiketStatus;
};

export function TiketStatusBar({ status }: Props) {
  if (status === "dibatalkan") {
    return (
      <View style={styles.cancelledBanner}>
        <Text style={styles.cancelledText}>Tiket Dibatalkan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => {
          const state = tiketProgressStepState(status, step.key);
          const color = COLOR_BY_STATE[state];
          return (
            <View key={step.key} style={styles.stepWrapper}>
              <View style={[styles.segment, { backgroundColor: color }]} />
              {index < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor:
                        state === "done" ? COLOR_BY_STATE.done : "#e5e7eb",
                    },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {STEPS.map((step) => {
          const state = tiketProgressStepState(status, step.key);
          return (
            <Text
              key={step.key}
              style={[styles.label, { color: COLOR_BY_STATE[state] }]}
            >
              {step.label}
              {state === "blocked" ? " (Pending)" : ""}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  segment: {
    height: 8,
    flex: 1,
    borderRadius: 4,
  },
  connector: {
    width: 6,
  },
  labelsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  label: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
  },
  cancelledBanner: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelledText: {
    color: "#dc2626",
    fontWeight: "700",
  },
});
