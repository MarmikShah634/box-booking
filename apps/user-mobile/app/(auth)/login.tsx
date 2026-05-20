import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userApi } from '@/lib/api';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from '@/constants/theme';

const schema = z.object({
  phone: z
    .string()
    .length(10, 'Enter a valid 10-digit number')
    .regex(/^\d+$/, 'Only digits allowed'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    const result = await userApi.post<{ message: string }>(
      '/auth/user/send-otp',
      { phone: `+91${values.phone}` },
    );
    if (!result.ok) {
      setApiError(result.error);
      return;
    }
    router.push({ pathname: '/(auth)/verify', params: { phone: values.phone } });
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
          {/* Brand header */}
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="baseball" size={28} color={Colors.white} />
            </View>
            <Text style={styles.brandName}>BoxCricket</Text>
          </View>

          {/* Hero section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Enter your{'\n'}mobile number</Text>
            <Text style={styles.heroSubtitle}>
              We'll send you a one-time password to verify your number.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  label="Mobile Number"
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.phone?.message}
                  leftElement={
                    <View style={styles.prefix}>
                      <Text style={styles.prefixText}>+91</Text>
                    </View>
                  }
                />
              )}
            />

            {apiError ? (
              <View style={styles.apiErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              size="lg"
              fullWidth
            >
              Send OTP
            </Button>

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  hero: {
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.md,
  },
  prefix: {
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.zinc200,
    marginRight: 2,
  },
  prefixText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc700,
  },
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#fef2f2',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  apiErrorText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    flex: 1,
  },
  terms: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  termsLink: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
});
