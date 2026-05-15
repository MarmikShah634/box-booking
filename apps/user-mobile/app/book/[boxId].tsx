import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shimmer } from '@/components/ui/Shimmer';
import { SlotButton, SlotData } from '@/components/booking/SlotButton';
import { userApi } from '@/lib/api';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';

type Step = 1 | 2 | 3;

interface SlotsResponse {
  slots: SlotData[];
}

interface HoldResponse {
  bookingId: string;
  holdExpiresAt: string;
}

interface BoxInfo {
  id: string;
  name: string;
  pricePerHour: number;
  venueName: string;
  city: string;
}

interface BoxInfoResponse {
  box: BoxInfo;
}

function getNextSevenDays(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): { day: string; num: string; month: string } {
  return {
    day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    num: date.getDate().toString(),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
  };
}

function HOLD_DURATION_SECONDS() {
  return 10 * 60; // 10 minutes
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function BookingScreen() {
  const { boxId } = useLocalSearchParams<{ boxId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [boxInfo, setBoxInfo] = useState<BoxInfo | null>(null);
  const [boxLoading, setBoxLoading] = useState(true);

  const days = getNextSevenDays();
  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);

  const [holdBookingId, setHoldBookingId] = useState<string | null>(null);
  const [holdCountdown, setHoldCountdown] = useState(HOLD_DURATION_SECONDS());
  const [isHolding, setIsHolding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bottomSheetScale = useSharedValue(0);
  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bottomSheetScale.value }],
    opacity: bottomSheetScale.value,
  }));

  // Fetch box info
  useEffect(() => {
    async function fetchBox() {
      if (!boxId) return;
      const result = await userApi.get<BoxInfoResponse>(`/boxes/${boxId}`);
      if (result.ok) setBoxInfo(result.data.box);
      setBoxLoading(false);
    }
    fetchBox();
  }, [boxId]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async (date: Date) => {
    if (!boxId) return;
    setSlotsLoading(true);
    setSlotsError('');
    const dateStr = formatDate(date);
    const result = await userApi.get<SlotsResponse>(
      `/slots?boxId=${boxId}&date=${dateStr}`,
    );
    if (!result.ok) {
      setSlotsError(result.error);
    } else {
      setSlots(result.data.slots ?? []);
    }
    setSlotsLoading(false);
  }, [boxId]);

  // Fetch slots when step 2 is reached
  useEffect(() => {
    if (step === 2) {
      fetchSlots(selectedDate);
    }
  }, [step, selectedDate, fetchSlots]);

  // Hold countdown
  useEffect(() => {
    if (holdBookingId) {
      holdTimerRef.current = setInterval(() => {
        setHoldCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(holdTimerRef.current!);
            Alert.alert('Hold Expired', 'Your slot hold has expired. Please try again.');
            setHoldBookingId(null);
            setStep(2);
            return HOLD_DURATION_SECONDS();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [holdBookingId]);

  // Animate price sheet when step 3 is active
  useEffect(() => {
    if (step === 3) {
      bottomSheetScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    } else {
      bottomSheetScale.value = withSpring(0, { damping: 14, stiffness: 200 });
    }
  }, [step, bottomSheetScale]);

  const handleSlotSelect = (slot: SlotData) => {
    setSelectedSlot((prev) => {
      if (prev?.id === slot.id) return null;
      return slot;
    });
  };

  // Update slot statuses when selection changes
  const enrichedSlots = slots.map((s) => ({
    ...s,
    status:
      s.status === 'booked'
        ? 'booked' as const
        : s.id === selectedSlot?.id
          ? 'selected' as const
          : 'available' as const,
  }));

  const handleHoldAndPay = async () => {
    if (!selectedSlot || !boxId) return;
    setIsHolding(true);
    const result = await userApi.post<HoldResponse>('/bookings/hold', {
      boxId,
      slotId: selectedSlot.id,
      date: formatDate(selectedDate),
    });
    setIsHolding(false);

    if (!result.ok) {
      Alert.alert('Error', result.error);
      return;
    }

    setHoldBookingId(result.data.bookingId);
    setHoldCountdown(HOLD_DURATION_SECONDS());
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    if (!holdBookingId) return;
    setIsPaying(true);

    // Razorpay integration note
    Alert.alert(
      'Payment Gateway',
      'Razorpay payment would launch here. This is a demo — tapping OK will simulate a successful payment.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsPaying(false) },
        {
          text: 'Simulate Payment',
          onPress: async () => {
            const result = await userApi.post(`/bookings/${holdBookingId}/pay`, {
              paymentId: `pay_demo_${Date.now()}`,
            });
            setIsPaying(false);
            if (!result.ok) {
              Alert.alert('Payment failed', result.error);
              return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Booking Confirmed!', 'Your slot has been booked successfully.', [
              {
                text: 'View Booking',
                onPress: () => router.replace(`/me/booking/${holdBookingId}`),
              },
            ]);
          },
        },
      ],
    );
  };

  const priceBreakdown = selectedSlot
    ? {
        basePrice: selectedSlot.price,
        platformFee: Math.round(selectedSlot.price * 0.02),
        gst: Math.round(selectedSlot.price * 0.18),
        total: Math.round(selectedSlot.price * 1.20),
      }
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step > 1) {
              setStep((s) => (s - 1) as Step);
            } else {
              router.back();
            }
          }}
          style={styles.headerBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.zinc800} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Select Date' : step === 2 ? 'Select Slot' : 'Price Breakdown'}
          </Text>
          {boxInfo ? (
            <Text style={styles.headerSub}>{boxInfo.name} · {boxInfo.venueName}</Text>
          ) : null}
        </View>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step}/3</Text>
        </View>
      </View>

      {/* Step progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { flex: step / 3 }]} />
        <View style={[styles.progressEmpty, { flex: (3 - step) / 3 }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Date Selection */}
        {step === 1 ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a date</Text>
            <Text style={styles.stepSubtitle}>Select from the next 7 days</Text>
            <View style={styles.dateGrid}>
              {days.map((day) => {
                const { day: dayName, num, month } = formatDisplayDate(day);
                const isSelected = formatDate(day) === formatDate(selectedDate);
                const isToday = formatDate(day) === formatDate(new Date());
                return (
                  <Pressable
                    key={formatDate(day)}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDate(day);
                    }}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  >
                    <Text
                      style={[
                        styles.dateDayName,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {isToday ? 'Today' : dayName}
                    </Text>
                    <Text
                      style={[styles.dateNum, isSelected && styles.dateTextSelected]}
                    >
                      {num}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {month}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Button
              onPress={() => setStep(2)}
              size="lg"
              fullWidth
              style={styles.ctaButton}
            >
              View Available Slots
            </Button>
          </View>
        ) : null}

        {/* Step 2: Slot Selection */}
        {step === 2 ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a slot</Text>
            <Text style={styles.stepSubtitle}>
              {selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>

            {/* Legend */}
            <View style={styles.legend}>
              {[
                { color: Colors.white, border: Colors.zinc200, label: 'Available' },
                { color: Colors.primaryLight, border: Colors.primary, label: 'Selected' },
                { color: Colors.zinc100, border: Colors.zinc200, label: 'Booked' },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: item.color, borderColor: item.border },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {slotsLoading ? (
              <View style={styles.slotGrid}>
                {[...Array(6)].map((_, i) => (
                  <Shimmer key={i} width="47%" height={80} borderRadius={Radius.md} />
                ))}
              </View>
            ) : slotsError ? (
              <EmptyState
                icon="wifi-outline"
                title="Failed to load slots"
                description={slotsError}
                ctaLabel="Try again"
                onCta={() => fetchSlots(selectedDate)}
              />
            ) : enrichedSlots.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="No slots available"
                description="There are no slots available for this date."
              />
            ) : (
              <View style={styles.slotGrid}>
                {enrichedSlots.map((slot) => (
                  <View key={slot.id} style={styles.slotItem}>
                    <SlotButton slot={slot} onPress={handleSlotSelect} />
                  </View>
                ))}
              </View>
            )}

            {selectedSlot ? (
              <View style={styles.selectedSlotBar}>
                <View>
                  <Text style={styles.selectedSlotLabel}>Selected</Text>
                  <Text style={styles.selectedSlotTime}>
                    {selectedSlot.startTime} – {selectedSlot.endTime}
                  </Text>
                </View>
                <Button onPress={handleHoldAndPay} loading={isHolding} size="md">
                  Hold &amp; Pay
                </Button>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Step 3: Price Breakdown */}
        {step === 3 ? (
          <Animated.View style={[styles.stepContent, bottomSheetStyle]}>
            <Text style={styles.stepTitle}>Price Breakdown</Text>

            {holdBookingId ? (
              <View style={styles.holdTimer}>
                <Ionicons name="time-outline" size={16} color={Colors.warning} />
                <Text style={styles.holdTimerText}>
                  Slot held for {formatCountdown(holdCountdown)}
                </Text>
              </View>
            ) : null}

            {selectedSlot && priceBreakdown ? (
              <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base price</Text>
                  <Text style={styles.priceValue}>
                    &#8377;{priceBreakdown.basePrice.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Platform fee (2%)</Text>
                  <Text style={styles.priceValue}>
                    &#8377;{priceBreakdown.platformFee.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>GST (18%)</Text>
                  <Text style={styles.priceValue}>
                    &#8377;{priceBreakdown.gst.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    &#8377;{priceBreakdown.total.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.slotSummaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="cube-outline" size={16} color={Colors.zinc400} />
                <Text style={styles.summaryText}>{boxInfo?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.zinc400} />
                <Text style={styles.summaryText}>
                  {selectedDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time-outline" size={16} color={Colors.zinc400} />
                <Text style={styles.summaryText}>
                  {selectedSlot?.startTime} – {selectedSlot?.endTime}
                </Text>
              </View>
            </View>

            <Button
              onPress={handleConfirmPayment}
              loading={isPaying}
              size="lg"
              fullWidth
              style={styles.ctaButton}
            >
              Confirm Payment
            </Button>

            <Text style={styles.paymentNote}>
              Secure payment powered by Razorpay
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  headerSub: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    marginTop: 1,
  },
  stepIndicator: {
    width: 40,
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc400,
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: Colors.zinc100,
  },
  progressFill: {
    backgroundColor: Colors.primary,
  },
  progressEmpty: {
    backgroundColor: Colors.zinc100,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  stepContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stepTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  stepSubtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    marginTop: -Spacing.sm,
  },
  // Date selection
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dateChip: {
    width: '13%',
    minWidth: 44,
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
    backgroundColor: Colors.white,
    gap: 2,
  },
  dateChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDayName: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  dateNum: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  dateMonth: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  dateTextSelected: {
    color: Colors.white,
  },
  ctaButton: {
    marginTop: Spacing.md,
  },
  // Slot grid
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotItem: {
    width: '47%',
  },
  selectedSlotBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  selectedSlotLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  selectedSlotTime: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  // Price breakdown
  holdTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#fff7ed',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  holdTimerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.warning,
  },
  priceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc600,
  },
  priceValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc800,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  slotSummaryCard: {
    backgroundColor: Colors.zinc50,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc700,
  },
  paymentNote: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    marginTop: -Spacing.xs,
  },
});
