import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/api';
import { storage, StorageKeys } from '@/lib/storage';
import { useAuthStore } from '@/store/auth';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants/theme';
import type { Owner } from '@/store/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  owner: Owner;
}

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    const result = await ownerApi<LoginResponse>('/api/v1/auth/owner/login', {
      method: 'POST',
      body: data,
      skipAuth: true,
    });

    if (!result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (result.status === 423) {
        setServerError('Your account has been locked. Please contact support.');
      } else if (result.status === 401 || result.status === 400) {
        setServerError('Invalid email or password. Please try again.');
      } else {
        setServerError(result.error);
      }
      return;
    }

    await storage.set(StorageKeys.REFRESH_TOKEN, result.data.refreshToken);
    setAuth(result.data.accessToken, result.data.owner);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Check your email for a password reset link, or visit our website to reset your password.');
  };

  const handleRegister = () => {
    Alert.alert('Register as Owner', 'Complete your registration on our website at boxcricket.com/owner/register to get started.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Ionicons name="tennisball" size={32} color={Colors.white} />
            </View>
            <Text style={styles.appName}>BoxCricket</Text>
            <Text style={styles.tagline}>Owner Portal</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to manage your venues</Text>

            {serverError !== null && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  rightIcon={
                    <Ionicons name="mail-outline" size={18} color={Colors.zinc400} />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label="Password"
                  placeholder="Enter your password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  secureToggle
                />
              )}
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.signInBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Not registered yet? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.footerLink}>Register as owner</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.xl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.zinc900,
  },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.zinc900,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  forgotText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  signInBtn: {
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
  },
  footerLink: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
