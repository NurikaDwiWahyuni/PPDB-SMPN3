'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * AnimasiMasuk — komponen wrapper untuk efek fade + slide-down
 *
 * Props:
 *  delay   — delay dalam ms sebelum animasi mulai (default 0)
 *  once    — animasi hanya jalan sekali saat masuk viewport (default true)
 *  className — tambahan class pada wrapper
 */
export function AnimasiMasuk({
  children,
  delay = 0,
  once = true,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  once?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, once])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/**
 * AnimasiTeks — animasi huruf/kata turun satu per satu
 *
 * Props:
 *  teks      — string yang akan dianimasi
 *  tag       — HTML tag (default 'span')
 *  per       — 'kata' atau 'huruf' (default 'kata')
 *  delay     — delay awal dalam ms
 *  className — class pada wrapper
 */
export function AnimasiTeks({
  teks,
  tag: Tag = 'span',
  per = 'kata',
  delay = 0,
  className = '',
}: {
  teks: string
  tag?: keyof React.JSX.IntrinsicElements
  per?: 'kata' | 'huruf'
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const items = per === 'kata' ? teks.split(' ') : teks.split('')
  const gap   = per === 'kata' ? 60 : 28

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WrapTag = Tag as any

  return (
    <WrapTag ref={ref} className={`inline ${className}`} aria-label={teks}>
      {items.map((item, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.45s ease ${i * gap}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * gap}ms`,
            whiteSpace: 'pre',
          }}
        >
          {item}{per === 'kata' && i < items.length - 1 ? ' ' : ''}
        </span>
      ))}
    </WrapTag>
  )
}

/**
 * AnimasiAngka — angka naik dari 0 ke nilai target
 */
export function AnimasiAngka({
  nilai,
  durasi = 1200,
  delay = 0,
  className = '',
}: {
  nilai: number
  durasi?: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [tampil, setTampil] = useState(0)
  const [mulai, setMulai]   = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setMulai(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  useEffect(() => {
    if (!mulai) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durasi, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setTampil(Math.round(eased * nilai))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [mulai, nilai, durasi])

  return (
    <span ref={ref} className={className}>
      {tampil}
    </span>
  )
}
