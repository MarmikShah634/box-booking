import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userApi } from '@/lib/api';
import { useAuthStore, AuthUser } from '@/store/auth';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from '@/constants/theme';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
    .trim(),
  email: z
    .string()
    .email('Enter a valid email address')
    .or(z.literal(''))
    .optional(),
});

type FormValues = z.infer<typeof schema>;

interface UpdateUserResponse {
  user: AuthUser;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    const result = await userApi.put<UpdateUserResponse>('/users/me', {
      name: values.name || undefined,
      email: values.email || undefined,
    });

    if (!result.ok) {
      setApiError(result.error);
      return;
    }

    if (accessToken && result.data.user) {
      await setAuth(accessToken, result.data.user);
    }

    Alert.alert('Success', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={20} color={Colors.zinc800} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.phone.slice(-2) ?? '??'}
              </Text>
            </View>
            <Text style={styles.avatarHint}>
              Your initials are used as your avatar
            </Text>
          </View>

          {/* Phone (read-only) */}
          <View style={styles.form}>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Mobile Number</Text>
              <View style={styles.readOnlyValue}>
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={Colors.zinc400}
                />
                <Text style={styles.readOnlyText}>{user?.phone}</Text>
              </View>
              <Text style={styles.readOnlyHint}>Phone number cannot be changed</Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                  helper="Optional — used for booking confirmations"
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
              disabled={!isDirty}
              size="lg"
              fullWidth
              style={styles.submitButton}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  avatarHint: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  form: {
    gap: Spacing.md,
  },
  readOnlyField: {
    gap: Spacing.xs,
  },
  readOnlyLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc700,
  },
  readOnlyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.zinc50,
  },
  readOnlyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  readOnlyHint: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
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
  submitButton: {
    marginTop: Spacing.sm,
  },
});
