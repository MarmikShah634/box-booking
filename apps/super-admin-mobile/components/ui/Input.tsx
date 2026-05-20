import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  secureToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, secureToggle, secureTextEntry, style, ...props },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.focused,
          error ? styles.errored : null,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  focused: {
    borderColor: Colors.primary,
  },
  errored: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    paddingVertical: Spacing.sm + 4,
    minHeight: 48,
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  hintText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
