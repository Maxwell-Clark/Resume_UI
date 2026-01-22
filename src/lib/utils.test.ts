import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className utility)', () => {
  it('merges multiple class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const condition = false
    const result = cn('foo', condition && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('handles undefined and null values', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles arrays of class names', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('handles objects with boolean values', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    })
    expect(result).toBe('foo baz')
  })

  it('merges tailwind classes correctly - last class wins', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('merges conflicting tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('preserves non-conflicting tailwind classes', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('handles padding conflicts', () => {
    const result = cn('p-4', 'px-2')
    expect(result).toBe('p-4 px-2')
  })

  it('handles margin conflicts', () => {
    const result = cn('m-4', 'mt-2')
    expect(result).toBe('m-4 mt-2')
  })

  it('handles empty string', () => {
    const result = cn('')
    expect(result).toBe('')
  })

  it('handles no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles complex combinations', () => {
    const trueCondition = true
    const falseCondition = false
    const result = cn(
      'base-class',
      trueCondition && 'conditional-true',
      falseCondition && 'conditional-false',
      { 'object-true': true, 'object-false': false },
      ['array-class']
    )
    expect(result).toBe('base-class conditional-true object-true array-class')
  })

  it('handles responsive classes correctly', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg')
    expect(result).toBe('text-sm md:text-base lg:text-lg')
  })

  it('merges conflicting responsive classes', () => {
    const result = cn('md:text-sm', 'md:text-lg')
    expect(result).toBe('md:text-lg')
  })

  it('handles state variants', () => {
    const result = cn('hover:bg-blue-500', 'hover:bg-red-500')
    expect(result).toBe('hover:bg-red-500')
  })

  it('handles dark mode classes', () => {
    const result = cn('dark:bg-slate-800', 'dark:bg-slate-900')
    expect(result).toBe('dark:bg-slate-900')
  })

  it('preserves arbitrary values', () => {
    const result = cn('w-[100px]', 'h-[50px]')
    expect(result).toBe('w-[100px] h-[50px]')
  })

  it('handles border radius conflicts', () => {
    const result = cn('rounded', 'rounded-lg')
    expect(result).toBe('rounded-lg')
  })

  it('handles font weight conflicts', () => {
    const result = cn('font-normal', 'font-bold')
    expect(result).toBe('font-bold')
  })

  it('handles flex and grid classes', () => {
    const result = cn('flex', 'flex-col', 'items-center', 'justify-between')
    expect(result).toBe('flex flex-col items-center justify-between')
  })

  it('handles width and height conflicts', () => {
    const result = cn('w-full', 'w-1/2')
    expect(result).toBe('w-1/2')
  })
})
