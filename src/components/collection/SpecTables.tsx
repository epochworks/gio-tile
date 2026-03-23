'use client'

import { useState } from 'react'

interface SpecRow {
  description: string
  result: string
  testMethod?: string
}

interface SpecTablesProps {
  techSpecs: SpecRow[]
  packagingData: any[]
  applications: string[]
  surfaces: string[]
  products: any[]
}

/* ── Shade variation labels (matching Figma) ── */
const shadeLabels: Record<string, string> = {
  V1: 'Uniform Variation',
  V2: 'Moderate Variation',
  V3: 'Heavy Variation',
  V4: 'Random Variation',
}

/*
 * Exact shade grid patterns from Figma.
 * Each cell is an rgba(17,17,17, opacity) value.
 * 0 = #f5f5f5 (lightest), 0.15, 0.3, 0.6 = darkest
 */
const shadePatterns: Record<number, number[][]> = {
  1: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  2: [
    [0.15, 0, 0, 0.15],
    [0, 0.15, 0, 0],
    [0, 0.15, 0, 0.15],
    [0.15, 0, 0.15, 0],
  ],
  3: [
    [0.15, 0, 0.3, 0.15],
    [0.3, 0.15, 0, 0],
    [0, 0.15, 0.3, 0.15],
    [0.3, 0, 0.15, 0],
  ],
  4: [
    [0.6, 0, 0.3, 0.15],
    [0.3, 0.15, 0.6, 0],
    [0, 0.15, 0.3, 0.15],
    [0.3, 0, 0.6, 0],
  ],
}

export default function SpecTables({
  techSpecs,
  packagingData,
  applications,
  surfaces,
  products,
}: SpecTablesProps) {
  const hasSpecs = techSpecs && techSpecs.length > 0
  const hasPackaging = packagingData && packagingData.length > 0

  // Get shade variations from products (shadeVariation can be a string like "V2" or an object like {aggregate: "V2", fleck: "V3"})
  const shadeVariations = new Set<string>()
  products.forEach((p: any) => {
    if (p?.shadeVariation) {
      if (typeof p.shadeVariation === 'string') {
        shadeVariations.add(p.shadeVariation)
      } else if (typeof p.shadeVariation === 'object') {
        // Extract string values from object (e.g. {aggregate: "V2", fleck: "V3"})
        Object.values(p.shadeVariation).forEach((v: any) => {
          if (typeof v === 'string' && v.startsWith('V')) shadeVariations.add(v)
        })
      }
    }
  })
  const activeShade = shadeVariations.size > 0 ? Array.from(shadeVariations)[0] : null

  const hasApplications = applications.length > 0 || surfaces.length > 0 || shadeVariations.size > 0

  if (!hasSpecs && !hasPackaging && !hasApplications) return null

  return (
    <div className="space-y-12 md:space-y-16 mb-16 md:mb-20">
      {/* ── Technical Specifications ── */}
      {hasSpecs && (
        <section>
          <SectionLabel>Technical Specifications</SectionLabel>
          <div className="mt-5 md:mt-6 overflow-visible">
            <table className="w-full text-[13px] md:text-[14px]">
              <tbody>
                {techSpecs.map((spec, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-[#f7f7f7]' : 'bg-white'}
                  >
                    <td className="py-4 px-4 md:px-5 text-gio-black/50 w-1/2">
                      {spec.description}
                    </td>
                    <td className="py-4 px-4 md:px-5 text-right text-gio-black font-medium">
                      <span className="inline-flex items-center gap-2">
                        {spec.result}
                        {spec.testMethod && (
                          <InfoTooltip text={spec.testMethod} />
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Shade Variation & Applications ── */}
      {hasApplications && (
        <section>
          <SectionLabel>Shade Variation & Applications</SectionLabel>
          <div className="mt-5 md:mt-6 overflow-visible">
            {/* Shade Variation */}
            {activeShade && (
              <div className="bg-[#f7f7f7] px-5 md:px-6 py-5 flex items-center justify-between">
                <span className="text-[13px] md:text-[14px] text-gio-black/50">
                  Shade Variation
                </span>
                <div className="flex items-center gap-4">
                  <ShadeGrid level={parseInt(activeShade.replace('V', ''), 10)} />
                  <div>
                    <p className="text-[16px] font-bold text-gio-black leading-tight tracking-[-0.32px]">
                      {activeShade}
                    </p>
                    <p className="text-[14px] text-gio-black/60 leading-tight tracking-[-0.28px] mt-1">
                      {shadeLabels[activeShade] || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Applications grid — always show all options */}
            <div className="bg-[#f7f7f7] px-5 md:px-6 py-5 mt-[12px]">
              <p className="text-[13px] md:text-[14px] text-gio-black/50 mb-4">
                Applications
              </p>
              <div>
                <table className="w-full text-[13px] md:text-[14px]">
                  <thead>
                    <tr>
                      <th className="w-[30%]" />
                      {['Residential', 'Commercial', 'Industrial'].map(
                        (app) => (
                          <th
                            key={app}
                            className="pb-3 text-center font-semibold text-gio-black"
                          >
                            {app}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {['Floor', 'Wall', 'Countertop'].map((surface, i) => (
                      <tr
                        key={surface}
                        className={i < 2 ? 'border-b border-gio-black/10' : ''}
                      >
                        <td className="py-3 md:py-3.5 text-center font-medium text-gio-black">
                          {surface}
                        </td>
                        {['Residential', 'Commercial', 'Industrial'].map(
                          (app) => {
                            const surfaceApplies = surfaces.includes(surface)
                            const appApplies = applications.includes(app)
                            return (
                              <td key={app} className="py-3 md:py-3.5 text-center">
                                {surfaceApplies && appApplies ? (
                                  <span className="inline-block w-3 h-3 md:w-3.5 md:h-3.5 bg-gio-red" />
                                ) : (
                                  <span className="inline-block w-3 h-[2px] bg-gio-black/30 rounded-full" />
                                )}
                              </td>
                            )
                          }
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Packaging ── */}
      {hasPackaging && (
        <section>
          <SectionLabel>Packaging</SectionLabel>
          <div className="mt-5 md:mt-6 overflow-visible">
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-[12px] lg:text-[13px] table-fixed">
                <thead>
                  <tr className="bg-[#f7f7f7] border-b border-gio-black/10">
                    {['Nominal Size', 'Pcs/Box', 'Sq.Ft/Box', 'Lbs/Box', 'Boxes/Plt', 'Sq.Ft/Plt', 'Lbs/Plt'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-3.5 px-2 lg:px-3 font-semibold text-gio-black ${i === 0 ? 'text-left w-[22%]' : 'text-center'}`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {packagingData.map((row: any, i: number) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f7f7]'}
                    >
                      <td className="py-3.5 px-2 lg:px-3 text-gio-black font-medium">
                        {row.nominalSize || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.piecesPerBox || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.sqftPerBox || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.lbsPerBox || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.boxesPerPallet || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.sqftPerPallet || '—'}
                      </td>
                      <td className="py-3.5 px-2 lg:px-3 text-center text-gio-black/70">
                        {row.weightPerPallet || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {packagingData.map((row: any, i: number) => (
                <div key={i} className="bg-[#f7f7f7] rounded-lg p-4 space-y-2.5">
                  <p className="text-[14px] font-medium text-gio-black border-b border-gio-black/10 pb-2.5">
                    {row.nominalSize || '—'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {[
                      ['Pcs/Box', row.piecesPerBox],
                      ['Sq.Ft/Box', row.sqftPerBox],
                      ['Lbs/Box', row.lbsPerBox],
                      ['Boxes/Pallet', row.boxesPerPallet],
                      ['Sq.Ft/Pallet', row.sqftPerPallet],
                      ['Lbs/Pallet', row.weightPerPallet],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between">
                        <span className="text-gio-black/50">{label}</span>
                        <span className="text-gio-black font-medium">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Shade variation visual grid (pixel-perfect from Figma) ── */
function ShadeGrid({ level }: { level: number }) {
  const pattern = shadePatterns[level] || shadePatterns[1]

  return (
    <div
      className="grid grid-cols-4 border border-black/80 overflow-hidden shrink-0"
      style={{ width: 74, height: 74 }}
    >
      {pattern.map((row, ri) =>
        row.map((opacity, ci) => (
          <div
            key={`${ri}-${ci}`}
            className="border-[0.5px] border-black/80"
            style={{
              backgroundColor:
                opacity === 0
                  ? '#f5f5f5'
                  : `rgba(17, 17, 17, ${opacity})`,
            }}
          />
        ))
      )}
    </div>
  )
}

/* ── Info tooltip ── */
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="text-gio-black/25 hover:text-gio-black/50 transition-colors cursor-help"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="9"
          fontWeight="500"
          fontFamily="system-ui"
        >
          i
        </text>
      </svg>
      {show && (
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gio-black text-white text-[11px] rounded-md whitespace-nowrap z-50 shadow-lg">
          {text}
          <span className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gio-black" />
        </span>
      )}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="heading-section">
      {children}
    </h2>
  )
}
