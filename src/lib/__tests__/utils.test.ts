import { cn } from '../utils'

describe('Utils Library', () => {
  describe('cn function', () => {
    it('combines classes correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      const result = cn('class1', false && 'class2', 'class3')
      expect(result).toBe('class1 class3')
    })

    it('handles undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('merges conflicting Tailwind classes correctly', () => {
      // Test that later classes override earlier ones
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('handles object syntax', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      })
      expect(result).toBe('class1 class3')
    })

    it('returns empty string for no valid classes', () => {
      const result = cn(false, null, undefined)
      expect(result).toBe('')
    })

    it('handles complex combination of inputs', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'conditional-true': true,
          'conditional-false': false
        },
        undefined,
        'final-class'
      )
      expect(result).toContain('base-class')
      expect(result).toContain('array-class-1')
      expect(result).toContain('array-class-2')
      expect(result).toContain('conditional-true')
      expect(result).not.toContain('conditional-false')
      expect(result).toContain('final-class')
    })
  })
})
