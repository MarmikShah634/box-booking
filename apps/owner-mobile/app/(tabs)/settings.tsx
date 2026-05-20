import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, right, destructive = false }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? Colors.error : Colors.zinc600}
        />
      </View>
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.menuRight}>
        {right !== undefined ? right : (
          <Ionicons name="chevron-forward" size={16} color={Colors.zinc400} />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const owner = useAuthStore((s) => s.owner);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setLoggingOut(true);
            clearAuth();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const showWebPortalAlert = (feature: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(feature, `Please use our web portal at boxcricket.com/owner to ${feature.toLowerCase()}.`, [{ text: 'OK' }]);
  };

  const showHelpAlert = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Help Center', 'Visit help.boxcricket.com for guides, FAQs, and troubleshooting articles.', [{ text: 'OK' }]);
  };

  const showContactAlert = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Contact Us', 'Email us at owner-support@boxcricket.com or call +91-1800-BOX-PLAY (Mon–Sat, 9AM–6PM).', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {owner?.name?.charAt(0)?.toUpperCase() ?? 'O'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {owner?.name ?? 'Owner'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {owner?.email ?? ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => showWebPortalAlert('Edit Profile')}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Section title="Account">
          <MenuItem
            icon="person-outline"
            label={owner?.name ?? 'Profile'}
            onPress={() => showWebPortalAlert('Edit Profile')}
            right={
              <Text style={styles.metaValue} numberOfLines={1}>
                {owner?.name ?? ''}
              </Text>
            }
          />
          <View style={styles.divider} />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => showWebPortalAlert('Change Password')}
          />
        </Section>

        <Section title="Business">
          <MenuItem
            icon="card-outline"
            label="Subscription Status"
            onPress={() => showWebPortalAlert('Manage Subscription')}
            right={<StatusBadge status="ACTIVE" />}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="KYC Status"
            onPress={() => showWebPortalAlert('Complete KYC')}
            right={<StatusBadge status={owner?.kycStatus ?? 'PENDING'} />}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="cash-outline"
            label="Razorpay Setup"
            onPress={() => showWebPortalAlert('Configure Razorpay')}
          />
        </Section>

        <Section title="Support">
          <MenuItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={showHelpAlert}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Contact Us"
            onPress={showContactAlert}
          />
        </Section>

        <Section title="Danger Zone">
          <MenuItem
            icon="log-out-outline"
            label={loggingOut ? 'Signing out...' : 'Sign Out'}
            onPress={handleLogout}
            destructive
          />
        </Section>

        <Text style={styles.version}>BoxCricket Owner v1.0.0</Text>
      </ScrollView>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.zinc900,
  },
  profileEmail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.zinc100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  menuIconDestructive: {
    backgroundColor: '#fef2f2',
  },
  menuLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.zinc800,
    flex: 1,
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  menuRight: {
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  metaValue: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    maxWidth: 120,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginLeft: Spacing.md + 34 + Spacing.md,
  },
  version: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc400,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
