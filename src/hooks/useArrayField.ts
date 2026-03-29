import { useState, useCallback, type Dispatch, type SetStateAction } from 'react'

export interface ArrayFieldOps<T> {
  items: T[]
  setItems: Dispatch<SetStateAction<T[]>>
  addItem: (defaultItem: T) => void
  updateItem: (index: number, field: keyof T, value: T[keyof T]) => void
  removeItem: (index: number) => void
  addNested: (parentIndex: number, arrayKey: keyof T) => void
  updateNested: (parentIndex: number, arrayKey: keyof T, nestedIndex: number, value: string) => void
  removeNested: (parentIndex: number, arrayKey: keyof T, nestedIndex: number) => void
}

export function useArrayField<T>(initialItems: T[], onAdd?: () => void): ArrayFieldOps<T> {
  const [items, setItems] = useState<T[]>(initialItems)

  const addItem = useCallback(
    (defaultItem: T) => {
      setItems((prev) => [...prev, defaultItem])
      onAdd?.()
    },
    [onAdd]
  )

  const updateItem = useCallback(
    (index: number, field: keyof T, value: T[keyof T]) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      )
    },
    []
  )

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addNested = useCallback((parentIndex: number, arrayKey: keyof T) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== parentIndex) return item
        const existing = item[arrayKey]
        return { ...item, [arrayKey]: [...(existing as string[]), ''] }
      })
    )
  }, [])

  const updateNested = useCallback(
    (parentIndex: number, arrayKey: keyof T, nestedIndex: number, value: string) => {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== parentIndex) return item
          const nested = [...(item[arrayKey] as string[])]
          nested[nestedIndex] = value
          return { ...item, [arrayKey]: nested }
        })
      )
    },
    []
  )

  const removeNested = useCallback(
    (parentIndex: number, arrayKey: keyof T, nestedIndex: number) => {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== parentIndex) return item
          const nested = (item[arrayKey] as string[]).filter((_, j) => j !== nestedIndex)
          return { ...item, [arrayKey]: nested }
        })
      )
    },
    []
  )

  return { items, setItems, addItem, updateItem, removeItem, addNested, updateNested, removeNested }
}
