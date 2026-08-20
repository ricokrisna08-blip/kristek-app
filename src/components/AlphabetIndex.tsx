import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";

const ALPHABET = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

type Props = {
  availableLetters: string[];
  onSelectLetter: (letter: string) => void;
};

// A-Z strip with 27 rows can't hit the usual 44px touch target per row on
// a phone screen -- that's the same trade-off Contacts/WhatsApp make. The
// whole strip is one continuous drag surface (not 27 discrete buttons), a
// touch that lands between letters snaps to the nearest available one, and
// the floating bubble gives feedback so users don't need pixel precision.
export function AlphabetIndex({ availableLetters, onSelectLetter }: Props) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [touchY, setTouchY] = useState(0);
  const containerRef = useRef<View>(null);
  const containerHeight = useRef(0);
  const containerPageY = useRef(0);
  const availableSet = useMemo(() => new Set(availableLetters), [availableLetters]);

  function nearestAvailableLetter(letter: string): string | null {
    const index = ALPHABET.indexOf(letter);
    for (let offset = 0; offset < ALPHABET.length; offset++) {
      const forward = ALPHABET[index + offset];
      if (forward && availableSet.has(forward)) return forward;
      const backward = ALPHABET[index - offset];
      if (backward && availableSet.has(backward)) return backward;
    }
    return null;
  }

  // locationX/Y from the native touch event aren't reliably populated by
  // react-native-web, so we use the PanResponder gestureState's screen-
  // absolute y0/moveY instead (consistent across native + web) and convert
  // to a local offset with the container's own measured page position.
  function handleTouch(pageY: number) {
    if (containerHeight.current <= 0 || availableSet.size === 0) return;
    const localY = pageY - containerPageY.current;
    const rawIndex = Math.floor((localY / containerHeight.current) * ALPHABET.length);
    const clampedIndex = Math.min(ALPHABET.length - 1, Math.max(0, rawIndex));
    const letter = nearestAvailableLetter(ALPHABET[clampedIndex]);
    if (!letter) return;
    setTouchY(localY);
    setActiveLetter(letter);
    onSelectLetter(letter);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_evt, gestureState) => handleTouch(gestureState.y0),
      onPanResponderMove: (_evt, gestureState) => handleTouch(gestureState.moveY),
      onPanResponderRelease: () => setActiveLetter(null),
      onPanResponderTerminate: () => setActiveLetter(null),
    })
  ).current;

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() => {
        containerRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
          containerHeight.current = height;
          containerPageY.current = pageY;
        });
      }}
      {...panResponder.panHandlers}
    >
      {ALPHABET.map((letter) => (
        <Text
          key={letter}
          style={[
            styles.letter,
            !availableSet.has(letter) && styles.letterDisabled,
            activeLetter === letter && styles.letterActive,
          ]}
        >
          {letter}
        </Text>
      ))}

      {activeLetter ? (
        <View style={[styles.bubble, { top: touchY - 24 }]} pointerEvents="none">
          <Text style={styles.bubbleText}>{activeLetter}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 20,
    paddingVertical: 4,
    justifyContent: "space-between",
    alignItems: "center",
  },
  letter: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1B7396",
  },
  letterDisabled: {
    color: "#cbd5e1",
  },
  letterActive: {
    color: "#fff",
    backgroundColor: "#1B7396",
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 3,
  },
  bubble: {
    position: "absolute",
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1B7396",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
});
