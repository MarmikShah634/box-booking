import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/lib/api';
import { useAuthStore, AuthUser } from '@/store/auth';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from '@/constants/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

interface VerifyResponse {
  accessToken: string;
  user: AuthUser;
}

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [apiError, setApiError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setApiError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const isOtpComplete = otp.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isOtpComplete) return;
    setIsVerifying(true);
    setApiError('');

    const result = await userApi.post<VerifyResponse>('/auth/user/verify-otp', {
      phone: `+91${phone}`,
      otp,
    });

    setIsVerifying(false);

    if (!result.ok) {
      setApiError(result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Clear digits on error
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setAuth(result.data.accessToken, result.data.user);
    router.replace('/(tabs)');
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    const result = await userApi.post<{ message: string }>('/auth/user/send-otp', {
      phone: `+91${phone}`,
    });
    setIsResending(false);

    if (!result.ok) {
      Alert.alert('Error', result.error);
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.zinc700} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.iconWrapper}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Enter the{'\n'}6-digit code</Text>
            <Text style={styles.subtitle}>
              Sent to{' '}
              <Text style={styles.phoneHighlight}>+91 {phone}</Text>
            </Text>
          </View>

          {/* OTP Input Grid */}
          <View style={styles.otpRow}>
            {Array(OTP_LENGTH)
              .fill(null)
              .map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digits[i] ? styles.otpInputFilled : null,
                    apiError ? styles.otpInputError : null,
                  ]}
                  value={digits[i]}
                  onChangeText={(text) => handleDigitChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  selectionColor={Colors.primary}
                  textAlign="center"
                />
              ))}
          </View>

          {apiError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          ) : null}

          <Button
            onPress={handleVerify}
            loading={isVerifying}
            disabled={!isOtpComplete}
            size="lg"
            fullWidth
            style={styles.verifyButton}
          >
            Verify OTP
          </Button>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            {cooldown > 0 ? (
              <Text style={styles.cooldownText}>Resend in {cooldown}s</Text>
            ) : (
              <Pressable onPress={handleResend} disabled={isResending}>
                <Text style={styles.resendLink}>
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.zinc100,
    marginBottom: Spacing.lg,
  },
  hero: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  phoneHighlight: {
    fontFamily: FontFamily.semibold,
    color: Colors.zinc700,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
    borderRadius: Radius.md,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
    backgroundColor: Colors.white,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
  },
  otpInputError: {
    borderColor: Colors.error,
    backgroundColor: '#fef2f2',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#fef2f2',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    flex: 1,
  },
  verifyButton: {
    marginBottom: Spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resendText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  cooldownText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc400,
  },
  resendLink: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
  },
});
