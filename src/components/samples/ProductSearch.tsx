'use client'

import { useState, useEffect, useRef } from 'react'
import { useSampleCart } from '@/context/SampleCartContext'

interface SearchResult {
  _id: string
  title: string
  colorName: string
  collection: { title: string; slug: { current: string } }
  finishes?: Array<{
    skus?: Array<{ code: string; size: string }>
  }>
}

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { addItem, isFull } = useSampleCart()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.products || [])
          setOpen(true)
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleAdd = (product: SearchResult, size?: string) => {
    const sku =
      product.finishes?.[0]?.skus?.find((s) => s.size === size)?.code ||
      product.finishes?.[0]?.skus?.[0]?.code ||
      ''

    addItem({
      productId: product._id,
      collectionTitle: product.collection?.title || '',
      colorName: product.colorName || product.title,
      size: size || '',
      sku,
    })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gio-black/25"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={
            isFull ? 'Sample limit reached (5/5)' : 'Search by collection or color...'
          }
          disabled={isFull}
          className="w-full border border-gio-black/10 pl-11 pr-4 py-3.5 text-[14px] text-gio-black placeholder:text-gio-black/25 focus:outline-none focus:border-gio-black/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gio-black/10 border-t-gio-black/40 rounded-full animate-spin" />
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 bg-white border border-gio-black/10 border-t-0 shadow-lg max-h-[320px] overflow-y-auto">
          {results.map((product) => {
            const sizes = new Set<string>()
            product.finishes?.forEach((f) =>
              f.skus?.forEach((s) => {
                if (s.size) sizes.add(s.size)
              })
            )
            const sizeArr = Array.from(sizes)

            return (
              <div
                key={product._id}
                className="px-4 py-3 hover:bg-gio-grey/50 border-b border-gio-black/5 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-gio-black">
                      {product.colorName || product.title}
                    </p>
                    <p className="text-[11px] text-gio-black/35">
                      {product.collection?.title}
                      {sizeArr.length > 0 && ` · ${sizeArr.join(', ')}`}
                    </p>
                  </div>
                  {sizeArr.length > 1 ? (
                    <div className="flex gap-1.5">
                      {sizeArr.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleAdd(product, size)}
                          className="text-[10px] px-2.5 py-1.5 border border-gio-black/10 text-gio-black/50 hover:border-gio-red hover:text-gio-red transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleAdd(product, sizeArr[0] || '')
                      }
                      className="text-[11px] text-gio-red hover:text-gio-red/70 transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-30 top-full left-0 right-0 bg-white border border-gio-black/10 border-t-0 shadow-lg px-4 py-6 text-center">
          <p className="text-[13px] text-gio-black/30">
            No products found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
