export default function MetaSpans({ collection }: { collection: any }) {
  const parts: string[] = []
  if (collection.colorCount > 0) {
    parts.push(`${collection.colorCount} ${collection.colorCount === 1 ? 'Color' : 'Colors'}`)
  }
  if (collection.sizeCount > 0) {
    parts.push(`${collection.sizeCount} ${collection.sizeCount === 1 ? 'Size' : 'Sizes'}`)
  }
  if (collection.finishCount > 0) {
    parts.push(`${collection.finishCount} ${collection.finishCount === 1 ? 'Finish' : 'Finishes'}`)
  }
  if (parts.length === 0) return null
  return (
    <span className="flex items-center gap-2">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </span>
  )
}
