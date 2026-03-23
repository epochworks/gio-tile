interface SizeIconProps {
  size: string
  active?: boolean
  /** Pixels per inch — passed by parent to keep sizes relative within a collection */
  scale?: number
  /** Hide the text label below the icon */
  hideLabel?: boolean
  /** Override the icon area height (default 100) */
  areaHeight?: number
  /** URL to a custom SVG/PNG icon that overrides the auto-generated shape */
  customIconUrl?: string
}

type SizeShape = 'rect' | 'hex' | 'round' | 'versailles' | 'mosaic' | 'bullnose' | 'covebase'

/**
 * Parses a size string like "24x48", "6\"x36\"", "2x2 Mosaic", "3x24 Bullnose", "6x12 Cove Base"
 * and returns width/height and a shape type.
 */
export function parseSize(size: string): {
  w: number
  h: number
  shape: SizeShape
} {
  if (!size || typeof size !== 'string') return { w: 1, h: 1, shape: 'rect' }
  const lower = size.toLowerCase().trim()

  if (lower.includes('hex')) {
    return { w: 7, h: 7, shape: 'hex' }
  }
  if (lower.includes('penny') || lower.includes('round')) {
    return { w: 1, h: 1, shape: 'round' }
  }
  if (lower.includes('versailles')) {
    return { w: 1, h: 1, shape: 'versailles' }
  }

  // Clean quotes and extract numbers
  const cleaned = lower.replace(/["″'']/g, '').replace(/\s+/g, ' ')
  const match = cleaned.match(/([\d.]+)\s*[x×]\s*([\d.]+)/)

  const isMosaic = lower.includes('mosaic') || lower.includes('mosaico')
  const isBullnose = lower.includes('bullnose') || lower.includes('bull')
  const isCoveBase = lower.includes('cove') || lower.includes('base')

  if (match) {
    const w = parseFloat(match[1])
    const h = parseFloat(match[2])

    if (isMosaic) return { w, h, shape: 'mosaic' }
    if (isBullnose) return { w, h, shape: 'bullnose' }
    if (isCoveBase) return { w, h, shape: 'covebase' }

    // Small tiles (both dims ≤ 2) with equal sides are likely mosaics
    if (w <= 2 && h <= 2 && w === h) return { w, h, shape: 'mosaic' }

    return { w, h, shape: 'rect' }
  }

  return { w: 1, h: 1, shape: 'rect' }
}

/**
 * Compute a scale factor (px per inch) so that the largest tile in a set
 * fills the icon area, and smaller tiles are proportionally smaller.
 * If there's only one size, it fills a comfortable area.
 */
export function computeScale(sizes: string[]): number {
  const MAX_H = 90
  let maxDim = 0

  for (const s of sizes) {
    const { w, h } = parseSize(s)
    maxDim = Math.max(maxDim, w, h)
  }

  if (maxDim === 0) return 1.6
  return MAX_H / maxDim
}

const ICON_AREA_H_DEFAULT = 100

export default function SizeIcon({ size, active, scale: scaleProp, hideLabel, areaHeight, customIconUrl }: SizeIconProps) {
  const { w, h, shape } = parseSize(size)
  const ICON_AREA_H = areaHeight || ICON_AREA_H_DEFAULT

  // Custom icon override — render uploaded image instead of auto-generated SVG
  if (customIconUrl) {
    const imgSize = areaHeight ? Math.min(areaHeight, 80) : 80
    return (
      <div className={`flex flex-col items-center gap-2.5 ${active ? 'text-gio-red' : ''}`}>
        <div style={{ height: ICON_AREA_H }} className="flex items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customIconUrl}
            alt={size}
            width={imgSize}
            height={imgSize}
            className={`object-contain ${!active ? 'opacity-40' : ''}`}
            style={{ maxHeight: imgSize, maxWidth: imgSize }}
          />
        </div>
        {!hideLabel && (
          <span className={`text-[13px] tracking-[-0.02em] whitespace-nowrap ${!active ? 'text-gio-black' : ''}`}>
            {size}
          </span>
        )}
      </div>
    )
  }

  // Use provided scale or a default that makes the tile fill ~90px on the longest side
  const pxPerInch = scaleProp || (90 / Math.max(w, h))

  // For special shapes, use fixed sizes
  if (shape === 'hex' || shape === 'round' || shape === 'versailles') {
    const specialSize = areaHeight ? Math.min(areaHeight, 60) : 60
    return (
      <div className={`flex flex-col items-center gap-2.5 ${active ? 'text-gio-red' : ''}`}>
        <div style={{ height: ICON_AREA_H }} className={`flex items-end justify-center ${!active ? 'text-gio-black/40' : ''}`}>
          <svg width={specialSize} height={specialSize} viewBox="0 0 60 60" fill="none" className="overflow-visible">
            {shape === 'hex' && (
              <polygon
                points="30,6 52,18 52,42 30,54 8,42 8,18"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            )}
            {shape === 'round' && (
              <circle cx="30" cy="30" r="22" stroke="currentColor" strokeWidth="1" fill="none" />
            )}
            {shape === 'versailles' && (
              <>
                <rect x="4" y="4" width="24" height="24" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="32" y="4" width="24" height="12" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="32" y="20" width="12" height="12" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="48" y="20" width="8" height="12" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="4" y="32" width="52" height="24" stroke="currentColor" strokeWidth="1" fill="none" />
              </>
            )}
          </svg>
        </div>
        {!hideLabel && <span className={`text-[13px] tracking-[-0.02em] whitespace-nowrap ${!active ? 'text-gio-black' : ''}`}>{size}</span>}
      </div>
    )
  }

  // Scale dimensions proportionally — preserve aspect ratio
  let iconW = w * pxPerInch
  let iconH = h * pxPerInch

  // If too tall, scale both down proportionally
  if (iconH > ICON_AREA_H) {
    const s = ICON_AREA_H / iconH
    iconW *= s
    iconH *= s
  }

  // Enforce a minimum size but preserve aspect ratio
  const minVisible = 10
  if (iconW < minVisible && iconH < minVisible) {
    const s = minVisible / Math.min(iconW, iconH)
    iconW *= s
    iconH *= s
  }

  const svgW = iconW + 4
  const svgH = iconH + 4

  return (
    <div className={`flex flex-col items-center gap-2.5 ${active ? 'text-gio-red' : ''}`}>
      <div style={{ height: ICON_AREA_H }} className={`flex items-end justify-center ${!active ? 'text-gio-black/40' : ''}`}>
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          fill="none"
          className="overflow-visible"
        >
          {shape === 'mosaic' && <MosaicShape w={iconW} h={iconH} svgW={svgW} svgH={svgH} />}
          {shape === 'bullnose' && <BullnoseShape w={iconW} h={iconH} svgW={svgW} svgH={svgH} />}
          {shape === 'covebase' && <CoveBaseShape w={iconW} h={iconH} svgW={svgW} svgH={svgH} />}
          {shape === 'rect' && (
            <rect
              x={(svgW - iconW) / 2}
              y={(svgH - iconH) / 2}
              width={iconW}
              height={iconH}
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
          )}
        </svg>
      </div>
      {!hideLabel && <span className={`text-[13px] tracking-[-0.02em] whitespace-nowrap ${!active ? 'text-gio-black' : ''}`}>{size}</span>}
    </div>
  )
}

/* ── Mosaic: grid of small tiles (no gaps, just grid lines) ── */
function MosaicShape({ w, h, svgW, svgH }: { w: number; h: number; svgW: number; svgH: number }) {
  const cols = 4
  const rows = 4
  const gridSize = Math.min(w, h, 52)
  const offsetX = (svgW - gridSize) / 2
  const offsetY = (svgH - gridSize) / 2
  const cellW = gridSize / cols
  const cellH = gridSize / rows

  const lines = []

  // Outer border
  lines.push(
    <rect
      key="border"
      x={offsetX}
      y={offsetY}
      width={gridSize}
      height={gridSize}
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  )

  // Vertical grid lines
  for (let c = 1; c < cols; c++) {
    lines.push(
      <line
        key={`v-${c}`}
        x1={offsetX + c * cellW}
        y1={offsetY}
        x2={offsetX + c * cellW}
        y2={offsetY + gridSize}
        stroke="currentColor"
        strokeWidth="0.6"
      />
    )
  }

  // Horizontal grid lines
  for (let r = 1; r < rows; r++) {
    lines.push(
      <line
        key={`h-${r}`}
        x1={offsetX}
        y1={offsetY + r * cellH}
        x2={offsetX + gridSize}
        y2={offsetY + r * cellH}
        stroke="currentColor"
        strokeWidth="0.6"
      />
    )
  }

  return <>{lines}</>
}

/* ── Bullnose: rect with gradient on one long edge (left side) ── */
function BullnoseShape({ w, h, svgW, svgH }: { w: number; h: number; svgW: number; svgH: number }) {
  const x = (svgW - w) / 2
  const y = (svgH - h) / 2
  const gradId = `bull-${Math.round(w)}-${Math.round(h)}`

  // Determine which axis is the long side
  const isVertical = h >= w

  return (
    <>
      <defs>
        {isVertical ? (
          // Gradient from left edge → right (horizontal)
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="40%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        ) : (
          // Gradient from top edge → bottom (vertical)
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="40%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>
      <rect x={x} y={y} width={w} height={h} stroke="currentColor" strokeWidth="1" fill="none" />
      {isVertical ? (
        <>
          {/* Gradient fill on the left long edge */}
          <rect x={x} y={y} width={Math.min(w * 0.35, 8)} height={h} fill={`url(#${gradId})`} />
          {/* Thicker left edge stroke */}
          <line x1={x} y1={y} x2={x} y2={y + h} stroke="currentColor" strokeWidth="2" />
        </>
      ) : (
        <>
          {/* Gradient fill on the top long edge */}
          <rect x={x} y={y} width={w} height={Math.min(h * 0.35, 8)} fill={`url(#${gradId})`} />
          {/* Thicker top edge stroke */}
          <line x1={x} y1={y} x2={x + w} y2={y} stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </>
  )
}

/* ── Cove Base: rect with rounded bottom edge ── */
function CoveBaseShape({ w, h, svgW, svgH }: { w: number; h: number; svgW: number; svgH: number }) {
  const x = (svgW - w) / 2
  const y = (svgH - h) / 2
  const r = Math.min(w * 0.15, 6)

  return (
    <>
      <path
        d={`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} Z`}
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <defs>
        <linearGradient id={`cove-${Math.round(w)}-${Math.round(h)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="60%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#cove-${Math.round(w)}-${Math.round(h)})`} />
    </>
  )
}
