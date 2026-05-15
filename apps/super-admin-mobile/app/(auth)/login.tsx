import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { superAdminApi } from '@/lib/api';
import { setItem, StorageKeys } from '@/lib/storage';
import { useAuthStore } from '@/store/auth';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

const stepOneSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const stepTwoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d+$/, 'TOTP must be numeric'),
});

type StepOneData = z.infer<typeof stepOneSchema>;
type StepTwoData = z.infer<typeof stepTwoSchema>;

interface LoginResponse {
  requiresTotp?: boolean;
  accessToken?: string;
  refreshToken?: string;
  admin?: { id: string; email: string };
}

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storedCredentials, setStoredCredentials] = useState<StepOneData | null>(null);
  const totpRef = useRef<TextInput>(null);

  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: { email: '', password: '' },
  });

  const stepTwoForm = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: { email: '', password: '', totpCode: '' },
  });

  async function handleStepOne(data: StepOneData) {
    setLoading(true);
    setErrorMessage(null);
    setLockedOut(false);

    const result = await superAdminApi<LoginResponse>('/api/v1/auth/super-admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: data.email, password: data.password }),
      skipAuth: true,
    });

    setLoading(false);

    if (!result.ok) {
      if (result.status === 423) {
        setLockedOut(true);
        setErrorMessage('Account locked for 30 minutes due to too many failed attempts.');
      } else {
        setErrorMessage(result.error);
      }
      return;
    }

    if (result.data.requiresTotp) {
      setStoredCredentials(data);
      stepTwoForm.setValue('email', data.email);
      stepTwoForm.setValue('password', data.password);
      setStep(2);
      setTimeout(() => totpRef.current?.focus(), 300);
      return;
    }

    if (result.data.accessToken && result.data.admin) {
      await finalizeLogin(result.data.accessToken, result.data.refreshToken, result.data.admin);
    } else {
      setErrorMessage('Unexpected server response. Please try again.');
    }
  }

  async function handleStepTwo(data: StepTwoData) {
    setLoading(true);
    setErrorMessage(null);
    setLockedOut(false);

    const result = await superAdminApi<LoginResponse>('/api/v1/auth/super-admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        totpCode: data.totpCode,
      }),
      skipAuth: true,
    });

    setLoading(false);

    if (!result.ok) {
      if (result.status === 423) {
        setLockedOut(true);
        setErrorMessage('Account locked for 30 minutes due to too many failed attempts.');
      } else {
        setErrorMessage(result.error);
      }
      return;
    }

    if (result.data.accessToken && result.data.admin) {
      await finalizeLogin(result.data.accessToken, result.data.refreshToken, result.data.admin);
    } else {
      setErrorMessage('Unexpected server response. Please try again.');
    }
  }

  async function finalizeLogin(
    accessToken: string,
    refreshToken: string | undefined,
    admin: { id: string; email: string }
  ) {
    await setItem(StorageKeys.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
    }
    await setItem(StorageKeys.ADMIN_DATA, JSON.stringify(admin));
    setAuth(accessToken, admin);
  }

  function handleBackToStep1() {
    setStep(1);
    setErrorMessage(null);
    setStoredCredentials(null);
    stepTwoForm.reset();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Restricted Access Banner */}
          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.banner}>
            <Ionicons name="shield-half-outline" size={18} color={Colors.white} />
            <Text style={styles.bannerText}>SUPER ADMIN — RESTRICTED ACCESS</Text>
          </Animated.View>

          {/* Logo / Branding */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.branding}>
            <View style={styles.logoCircle}>
              <Ionicons name="baseball-outline" size={32} color={Colors.white} />
            </View>
            <Text style={styles.appName}>BoxCricket</Text>
            <Text style={styles.appSub}>Platform Administration</Text>
          </Animated.View>

          {/* Step Indicator */}
          {step === 2 ? (
            <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.stepIndicator}>
              <View style={styles.stepDot} />
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Enter your 2FA code</Text>
            </Animated.View>
          ) : null}

          {/* Form Card */}
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>
              {step === 1 ? 'Sign In' : 'Two-Factor Authentication'}
            </Text>
            <Text style={styles.cardSub}>
              {step === 1
                ? 'Enter your admin credentials to continue'
                : `Enter the 6-digit code from your authenticator app`}
            </Text>

            {step === 1 ? (
              <>
                <Controller
                  control={stepOneForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Email Address"
                      placeholder="admin@boxcricket.in"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={stepOneForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Password"
                      placeholder="••••••••"
                      secureTextEntry
                      secureToggle
                      textContentType="password"
                      autoComplete="current-password"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}
                <Button
                  label={lockedOut ? 'Account Locked' : 'Continue'}
                  onPress={stepOneForm.handleSubmit(handleStepOne)}
                  loading={loading}
                  disabled={lockedOut}
                  fullWidth
                  style={styles.submitButton}
                />
              </>
            ) : (
              <>
                <View style={styles.totpInfo}>
                  <Ionicons name="phone-portrait-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.totpInfoText}>
                    Signed in as {storedCredentials?.email}
                  </Text>
                </View>
                <Controller
                  control={stepTwoForm.control}
                  name="totpCode"
                  render={({ field, fieldState }) => (
                    <Input
                      ref={totpRef}
                      label="Authenticator Code"
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
                      textContentType="oneTimeCode"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}
                <Button
                  label={lockedOut ? 'Account Locked' : 'Verify & Sign In'}
                  onPress={stepTwoForm.handleSubmit(handleStepTwo)}
                  loading={loading}
                  disabled={lockedOut}
                  fullWidth
                  style={styles.submitButton}
                />
                <Button
                  label="Back"
                  onPress={handleBackToStep1}
                  variant="ghost"
                  fullWidth
                  disabled={loading}
                />
              </>
            )}
          </Animated.View>

          {/* Security Note */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.securityNote}>
            <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.securityNoteText}>
              5 failed attempts will lock your account for 30 minutes
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  bannerText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: Colors.white,
    letterSpacing: 1.2,
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  appSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  totpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  totpInfoText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: Spacing.sm,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  securityNoteText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
