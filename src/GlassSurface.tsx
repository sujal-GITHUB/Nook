import { useEffect, useId, useRef, useState, type CSSProperties, type PropsWithChildren } from 'react'

type GlassSurfaceProps = PropsWithChildren<{
  className?: string
  style?: CSSProperties
  borderRadius?: number
  brightness?: number
  opacity?: number
  blur?: number
  displace?: number
  borderWidth?: number
  distortionScale?: number
  saturation?: number
  mixBlendMode?: CSSProperties['mixBlendMode']
}>

/** Small, dependency-free adaptation of React Bits Glass Surface for the mobile workspace dock. */
export function GlassSurface({
  children,
  className = '',
  style,
  borderRadius = 22,
  brightness = 50,
  opacity = 0.9,
  blur = 10,
  displace = 0.5,
  borderWidth = 0.08,
  distortionScale = -55,
  saturation = 1.25,
  mixBlendMode = 'screen',
}: GlassSurfaceProps) {
  const id = useId().replace(/:/g, '-')
  const filterId = `nook-glass-filter-${id}`
  const redGradientId = `nook-glass-red-${id}`
  const blueGradientId = `nook-glass-blue-${id}`
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<SVGFEImageElement>(null)
  const redRef = useRef<SVGFEDisplacementMapElement>(null)
  const greenRef = useRef<SVGFEDisplacementMapElement>(null)
  const blueRef = useRef<SVGFEDisplacementMapElement>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)
  const [supportsRefraction, setSupportsRefraction] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDisplacementMap = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      const edgeSize = Math.min(width, height) * borderWidth * 0.5
      const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${redGradientId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="${blueGradientId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${width}" height="${height}" fill="black"/><rect width="${width}" height="${height}" rx="${borderRadius}" fill="url(#${redGradientId})"/><rect width="${width}" height="${height}" rx="${borderRadius}" fill="url(#${blueGradientId})" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edgeSize}" y="${edgeSize}" width="${Math.max(0, width - edgeSize * 2)}" height="${Math.max(0, height - edgeSize * 2)}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`
      imageRef.current?.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`)
    }

    updateDisplacementMap()
    const observer = new ResizeObserver(updateDisplacementMap)
    observer.observe(container)
    return () => observer.disconnect()
  }, [borderRadius, borderWidth, brightness, blur, blueGradientId, mixBlendMode, opacity, redGradientId])

  useEffect(() => {
    const userAgent = navigator.userAgent
    const unsupportedBrowser = /Firefox/.test(userAgent) || (/Safari/.test(userAgent) && !/Chrome|Chromium|Android/.test(userAgent))
    const supported = !unsupportedBrowser && CSS.supports('backdrop-filter', `url(#${filterId})`)
    setSupportsRefraction(supported)

    for (const [ref, offset] of [[redRef, 0], [greenRef, 8], [blueRef, 16]] as const) {
      ref.current?.setAttribute('scale', String(distortionScale + offset))
      ref.current?.setAttribute('xChannelSelector', 'R')
      ref.current?.setAttribute('yChannelSelector', 'G')
    }
    blurRef.current?.setAttribute('stdDeviation', String(displace))
  }, [displace, distortionScale, filterId])

  const surfaceStyle: CSSProperties = {
    ...style,
    borderRadius,
    '--glass-filter': `url(#${filterId})`,
    '--glass-saturation': saturation,
  } as CSSProperties

  return <div ref={containerRef} className={`glass-surface ${supportsRefraction ? 'glass-surface--svg' : 'glass-surface--fallback'} ${className}`} style={surfaceStyle}>
    <svg className="glass-surface__filter" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={imageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="displaced-red" />
          <feColorMatrix in="displaced-red" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="displaced-green" />
          <feColorMatrix in="displaced-green" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="displaced-blue" />
          <feColorMatrix in="displaced-blue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="red-green" />
          <feBlend in="red-green" in2="blue" mode="screen" result="refracted" />
          <feGaussianBlur ref={blurRef} in="refracted" stdDeviation="0.5" />
        </filter>
      </defs>
    </svg>
    <div className="glass-surface__content">{children}</div>
  </div>
}
