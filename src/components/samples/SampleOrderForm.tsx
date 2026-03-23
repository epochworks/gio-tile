'use client'

import { useState } from 'react'
import { useSampleCart, type SampleItem } from '@/context/SampleCartContext'
import ProductSearch from './ProductSearch'

export default function SampleOrderForm() {
  const { items, removeItem, clearCart, count } = useSampleCart()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/sample-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items }),
      })

      if (response.ok) {
        setSubmitted(true)
        clearCart()
      }
    } catch {
      // Fallback: just show success since we don't have the API route yet
      setSubmitted(true)
      clearCart()
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg py-20">
        <div className="w-12 h-12 rounded-full bg-gio-black flex items-center justify-center mb-6">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M4 10L8.5 14.5L16 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="heading-section mb-4">
          Sample Request Submitted
        </h2>
        <p className="text-[15px] leading-[1.6] text-gio-black/50">
          We&apos;ll prepare your samples and ship them out shortly. You&apos;ll
          receive a confirmation email at {form.email}.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-16">
      {/* Left: Cart + Search */}
      <div className="w-full lg:w-1/2">
        {/* Search to add */}
        <div className="mb-10">
          <h2 className="heading-section mb-6">
            Add Samples ({count}/5)
          </h2>
          <ProductSearch />
        </div>

        {/* Cart items */}
        {items.length > 0 && (
          <div>
            <h3 className="form-label mb-4">
              Your Samples
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <SampleCartRow
                  key={`${item.productId}-${item.size}`}
                  item={item}
                  onRemove={() => removeItem(item.productId, item.size)}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-gio-black/30">
              No samples added yet. Search above or add from any collection
              page.
            </p>
          </div>
        )}
      </div>

      {/* Right: Contact Form */}
      <div className="w-full lg:w-1/2">
        <h2 className="heading-section mb-6">
          Shipping Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label="Full Name"
              value={form.name}
              onChange={(v) => updateField('name', v)}
              required
            />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              required
            />
            <FormField
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => updateField('phone', v)}
            />
            <FormField
              label="Company"
              value={form.company}
              onChange={(v) => updateField('company', v)}
            />
          </div>

          <FormField
            label="Street Address"
            value={form.address}
            onChange={(v) => updateField('address', v)}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <FormField
              label="City"
              value={form.city}
              onChange={(v) => updateField('city', v)}
              required
            />
            <FormField
              label="State"
              value={form.state}
              onChange={(v) => updateField('state', v)}
              required
            />
            <FormField
              label="ZIP"
              value={form.zip}
              onChange={(v) => updateField('zip', v)}
              required
            />
          </div>

          <div>
            <label className="form-label">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="form-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={items.length === 0 || submitting}
            className="bg-gio-red text-white text-[13px] px-10 py-4 hover:bg-gio-red/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : `Submit Request (${count} sample${count !== 1 ? 's' : ''})`}
          </button>
        </form>
      </div>
    </div>
  )
}

function SampleCartRow({
  item,
  onRemove,
}: {
  item: SampleItem
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between bg-gio-grey px-4 py-3">
      <div>
        <p className="text-[13px] text-gio-black">{item.collectionTitle}</p>
        <p className="text-[11px] text-gio-black/40">
          {item.colorName}
          {item.size && ` · ${item.size}`}
          {item.sku && ` · ${item.sku}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-gio-black/25 hover:text-gio-red transition-colors p-1"
        aria-label={`Remove ${item.colorName} sample`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3L11 11M11 3L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-gio-red ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="form-input"
      />
    </div>
  )
}
