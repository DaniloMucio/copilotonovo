import { loginSchema, profileUpdateSchema } from '../validations'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        remember: true
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.password).toBe('password123')
        expect(result.data.remember).toBe(true)
      }
    })

    it('validates with default remember value', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.remember).toBe(false)
      }
    })

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Por favor, insira um email válido.')
      }
    })

    it('rejects empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Senha é obrigatória.')
      }
    })

    it('rejects missing email', () => {
      const invalidData = {
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('profileUpdateSchema', () => {
    it('validates correct profile data', () => {
      const validData = {
        displayName: 'João Silva',
        cnh: '12345678901'
      }
      
      const result = profileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.displayName).toBe('João Silva')
        expect(result.data.cnh).toBe('12345678901')
      }
    })

    it('validates with only required field', () => {
      const validData = {
        displayName: 'João Silva'
      }
      
      const result = profileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.displayName).toBe('João Silva')
        expect(result.data.cpf).toBeUndefined()
        expect(result.data.cnh).toBeUndefined()
        expect(result.data.phone).toBeUndefined()
      }
    })

    it('rejects short displayName', () => {
      const invalidData = {
        displayName: 'J'
      }
      
      const result = profileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nome deve ter pelo menos 2 caracteres.')
      }
    })

    it('rejects missing displayName', () => {
      const invalidData = {
        cpf: '123.456.789-00'
      }
      
      const result = profileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('validates with only displayName', () => {
      const validData = {
        displayName: 'João Silva'
      }
      
      const result = profileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})
