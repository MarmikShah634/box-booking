import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  helper,
  error,
  containerStyle,
  leftElement,
  rightElement,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
      ? Colors.primary
      : Colors.zinc200;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftElement ? <View style={styles.leftElement}>{leftElement}</View> : null}
        <TextInput
          {...props}
          style={[styles.input, leftElement ? styles.inputWithLeft : null, props.style]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={Colors.zinc400}
          selectionColor={Colors.primary}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc700,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc900,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  inputWithLeft: {
    paddingLeft: Spacing.xs,
  },
  leftElement: {
    paddingLeft: Spacing.md,
  },
  rightElement: {
    paddingRight: Spacing.md,
  },
  helperText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  errorText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.error,
  },
});
