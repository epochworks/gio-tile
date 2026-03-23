'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'article'
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  )
}
