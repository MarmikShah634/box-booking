'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
  duration?: number
}

let toastIdCounter = 0

// Simple singleton for global toast state
const listeners: Array<(toasts: Toast[]) => void> = []
let toastQueue: Toast[] = []

function notify() {
  listeners.forEach((l) => l([...toastQueue]))
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = String(++toastIdCounter)
  const duration = options.duration ?? 4000
  const newToast: Toast = { id, ...options }
  toastQueue = [...toastQueue, newToast]
  notify()
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notify()
  }, duration)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastQueue)

  // Register listener
  if (!listeners.includes(setToasts)) {
    listeners.push(setToasts)
  }

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notify()
  }, [])

  return { toasts, toast, dismiss }
}
