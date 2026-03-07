import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from "react-native";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

const TEAL = "#0d9488";
const BORDER_DEFAULT = "#D1D5DB";
const BORDER_ERROR = "#DC2626";
const LABEL_COLOR = "#6B7280";

export default function TextInput({
  label,
  error,
  style,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const resolveBorderColor = (): string => {
    if (error) return BORDER_ERROR;
    if (isFocused) return TEAL;
    return BORDER_DEFAULT;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <RNTextInput
        style={[
          styles.input,
          { borderColor: resolveBorderColor() },
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        onFocus={(e) => {
          setIsFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: LABEL_COLOR,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  error: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
});
