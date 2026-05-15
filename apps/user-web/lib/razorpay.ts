declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export interface RazorpayOptions {
  key: string
  amount: number // in paise
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayInstance {
  open(): void
  close(): void
  on(event: string, handler: () => void): void
}

let scriptLoading: Promise<boolean> | null = null

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  if (!scriptLoading) {
    scriptLoading = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => {
        scriptLoading = null
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  return scriptLoading
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    throw new Error('Failed to load Razorpay. Please try again.')
  }
  const rzp = new window.Razorpay(options)
  rzp.open()
}
