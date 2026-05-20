'use client'

import { useCallback } from 'react'
import { openRazorpayCheckout, type RazorpayPaymentResponse } from '@/lib/razorpay'

interface RazorpayLauncherProps {
  orderId: string
  amountPaise: number
  description: string
  userName?: string
  userPhone?: string
  userEmail?: string
  onSuccess: (response: RazorpayPaymentResponse) => void
  onDismiss?: () => void
}

export function useRazorpayLauncher({
  orderId,
  amountPaise,
  description,
  userName,
  userPhone,
  userEmail,
  onSuccess,
  onDismiss,
}: RazorpayLauncherProps) {
  const launch = useCallback(async () => {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

    await openRazorpayCheckout({
      key,
      amount: amountPaise,
      currency: 'INR',
      name: 'BoxCricket',
      description,
      order_id: orderId,
      prefill: {
        name: userName,
        contact: userPhone,
        email: userEmail,
      },
      theme: {
        color: '#059669', // emerald-600
      },
      handler: onSuccess,
      modal: {
        ondismiss: onDismiss,
      },
    })
  }, [orderId, amountPaise, description, userName, userPhone, userEmail, onSuccess, onDismiss])

  return { launch }
}
