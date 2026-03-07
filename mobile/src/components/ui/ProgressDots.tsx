import { StyleSheet, View } from "react-native";

const TEAL = "#0d9488";
const INACTIVE_BORDER = "#D1D5DB";

interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === current ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  active: {
    backgroundColor: TEAL,
  },
  inactive: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: INACTIVE_BORDER,
  },
});
