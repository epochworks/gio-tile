'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export interface SampleItem {
  productId: string
  collectionTitle: string
  colorName: string
  size: string
  sku: string
}

interface SampleCartContextValue {
  items: SampleItem[]
  addItem: (item: SampleItem) => boolean
  removeItem: (productId: string, size: string) => void
  clearCart: () => void
  isFull: boolean
  count: number
}

const MAX_SAMPLES = 5
const STORAGE_KEY = 'gio-sample-cart'

const SampleCartContext = createContext<SampleCartContextValue | null>(null)

export function SampleCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SampleItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addItem = useCallback(
    (item: SampleItem): boolean => {
      // Check if already at limit
      if (items.length >= MAX_SAMPLES) return false

      // Check if this exact item already exists
      const exists = items.some(
        (i) => i.productId === item.productId && i.size === item.size
      )
      if (exists) return false

      setItems((prev) => [...prev, item])
      return true
    },
    [items]
  )

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return (
    <SampleCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isFull: items.length >= MAX_SAMPLES,
        count: items.length,
      }}
    >
      {children}
    </SampleCartContext.Provider>
  )
}

export function useSampleCart() {
  const ctx = useContext(SampleCartContext)
  if (!ctx) {
    throw new Error('useSampleCart must be used within SampleCartProvider')
  }
  return ctx
}
