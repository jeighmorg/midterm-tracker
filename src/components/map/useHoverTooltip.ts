import { useCallback, useState, type MouseEvent } from 'react'

interface Position {
  x: number
  y: number
}

/** Tracks which map feature (by id) the cursor is over, plus its viewport position, for a following tooltip. */
export function useHoverTooltip<T extends string>() {
  const [hovered, setHovered] = useState<T | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  const handlers = useCallback(
    (id: T) => ({
      onMouseEnter: (e: MouseEvent) => {
        setHovered(id)
        setPosition({ x: e.clientX, y: e.clientY })
      },
      onMouseMove: (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY })
      },
      onMouseLeave: () => {
        setHovered(null)
        setPosition(null)
      },
    }),
    [],
  )

  return { hovered, position, handlers }
}
