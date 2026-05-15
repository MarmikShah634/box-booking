import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  secureToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, rightIcon, secureToggle = false, secureTextEntry, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);
    const borderAnim = useSharedValue(0);

    const handleFocus = () => {
      setIsFocused(true);
      borderAnim.value = withTiming(1, { duration: 180 });
      props.onFocus?.({} as Parameters<NonNullable<TextInputProps['onFocus']>>[0]);
    };

    const handleBlur = () => {
      setIsFocused(false);
      borderAnim.value = withTiming(0, { duration: 180 });
      props.onBlur?.({} as Parameters<NonNullable<TextInputProps['onBlur']>>[0]);
    };

    const animatedBorderStyle = useAnimatedStyle(() => ({
      borderColor: error
        ? Colors.error
        : borderAnim.value === 1
        ? Colors.primary
        : Colors.zinc200,
    }));

    return (
      <View style={[styles.container, containerStyle]}>
        {label !== undefined && label !== '' && (
          <Text style={[styles.label, isFocused && styles.labelFocused, error !== undefined && styles.labelError]}>
            {label}
          </Text>
        )}
        <Animated.View style={[styles.inputWrapper, animatedBorderStyle]}>
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={Colors.zinc400}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isSecure}
            {...props}
          />
          {secureToggle && (
            <TouchableOpacity
              onPress={() => setIsSecure((prev) => !prev)}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isSecure ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.zinc500}
              />
            </TouchableOpacity>
          )}
          {rightIcon !== undefined && !secureToggle && (
            <View style={styles.iconButton}>{rightIcon}</View>
          )}
        </Animated.View>
        {error !== undefined && error !== '' && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc600,
    marginBottom: 6,
  },
  labelFocused: {
    color: Colors.primary,
  },
  labelError: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc900,
    paddingVertical: Spacing.sm + 4,
    minHeight: 48,
  },
  iconButton: {
    paddingLeft: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 4,
  },
});
