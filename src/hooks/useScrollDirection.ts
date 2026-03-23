'use client'

import { useState, useEffect, useRef } from 'react'

export function useScrollDirection(threshold = 10): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          const diff = currentY - lastY.current

          if (Math.abs(diff) > threshold) {
            setDirection(diff > 0 ? 'down' : 'up')
            lastY.current = currentY
          }

          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return direction
}
