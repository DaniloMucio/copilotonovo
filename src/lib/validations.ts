import { z } from 'zod';

// Validações básicas reutilizáveis
export const emailSchema = z
  .string()
  .email({ message: "Por favor, insira um email válido." })
  .min(1, { message: "Email é obrigatório." });

export const passwordSchema = z
  .string()
  .min(6, { message: "A senha deve ter pelo menos 6 caracteres." })
  .regex(/[A-Za-z]/, { message: "A senha deve conter pelo menos uma letra." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." });

export const strongPasswordSchema = passwordSchema
  .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
    message: "CPF deve estar no formato 000.000.000-00" 
  })
  .refine((cpf) => {
    // Validação básica de CPF
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    
    // Cálculo dos dígitos verificadores
    const calculateDigit = (cpf: string, position: number) => {
      const sum = cpf
        .slice(0, position - 1)
        .split('')
        .reduce((acc, digit, index) => acc + parseInt(digit) * (position - index), 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    
    const firstDigit = calculateDigit(digits, 10);
    const secondDigit = calculateDigit(digits, 11);
    
    return (
      parseInt(digits[9]) === firstDigit &&
      parseInt(digits[10]) === secondDigit
    );
  }, { message: "CPF inválido." });

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { 
    message: "CNPJ deve estar no formato 00.000.000/0000-00" 
  });

export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, { 
    message: "Telefone deve estar no formato (00) 00000-0000" 
  });

export const cepSchema = z
  .string()
  .regex(/^\d{5}-\d{3}$/, { 
    message: "CEP deve estar no formato 00000-000" 
  });

export const moneySchema = z
  .number()
  .positive({ message: "O valor deve ser positivo." })
  .max(999999.99, { message: "Valor muito alto." });

export const kmSchema = z
  .number()
  .int({ message: "Quilometragem deve ser um número inteiro." })
  .min(0, { message: "Quilometragem não pode ser negativa." })
  .max(999999, { message: "Quilometragem muito alta." });

// Schemas para entidades
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres." })
    .max(50, { message: "Nome deve ter no máximo 50 caracteres." })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: "Nome deve conter apenas letras e espaços." }),
  userType: z.enum(['motorista', 'cliente'], {
    errorMap: () => ({ message: "Tipo de usuário deve ser 'motorista' ou 'cliente'." })
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Senha é obrigatória." }),
  remember: z.boolean().default(false),
});

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres." })
    .max(50, { message: "Nome deve ter no máximo 50 caracteres." }),
  cpf: cpfSchema.optional(),
  cnh: z
    .string()
    .regex(/^\d{11}$/, { message: "CNH deve ter 11 dígitos." })
    .optional(),
  phone: phoneSchema.optional(),
});

export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, { message: "Descrição é obrigatória." })
    .max(200, { message: "Descrição deve ter no máximo 200 caracteres." }),
  amount: moneySchema,
  category: z.enum([
    'Combustível',
    'Manutenção',
    'Alimentação',
    'Estacionamento',
    'Pedágio',
    'Outros'
  ], {
    errorMap: () => ({ message: "Categoria inválida." })
  }),
  observations: z
    .string()
    .max(500, { message: "Observações devem ter no máximo 500 caracteres." })
    .optional(),
  date: z.date(),
  km: kmSchema.optional(),
  pricePerLiter: moneySchema.optional(),
}).refine((data) => {
  // Se a categoria for combustível, km e preço por litro são obrigatórios
  if (data.category === 'Combustível') {
    return data.km !== undefined && data.pricePerLiter !== undefined;
  }
  return true;
}, {
  message: "Para despesas de combustível, quilometragem e preço por litro são obrigatórios.",
  path: ['category'],
});

export const deliverySchema = z.object({
  description: z
    .string()
    .min(1, { message: "Descrição é obrigatória." })
    .max(200, { message: "Descrição deve ter no máximo 200 caracteres." }),
  amount: moneySchema,
  paymentType: z.enum(['À vista', 'A receber'], {
    errorMap: () => ({ message: "Tipo de pagamento inválido." })
  }),
  senderCompany: z
    .string()
    .min(1, { message: "Empresa remetente é obrigatória." })
    .max(100, { message: "Nome da empresa deve ter no máximo 100 caracteres." }),
  recipientCompany: z
    .string()
    .min(1, { message: "Empresa destinatária é obrigatória." })
    .max(100, { message: "Nome da empresa deve ter no máximo 100 caracteres." }),
  senderAddress: z.object({
    cep: cepSchema,
    street: z.string().min(1, { message: "Rua é obrigatória." }),
    number: z.string().min(1, { message: "Número é obrigatório." }),
    neighborhood: z.string().min(1, { message: "Bairro é obrigatório." }),
    city: z.string().min(1, { message: "Cidade é obrigatória." }),
    state: z.string().length(2, { message: "Estado deve ter 2 caracteres." }),
  }),
  recipientAddress: z.object({
    cep: cepSchema,
    street: z.string().min(1, { message: "Rua é obrigatória." }),
    number: z.string().min(1, { message: "Número é obrigatório." }),
    neighborhood: z.string().min(1, { message: "Bairro é obrigatório." }),
    city: z.string().min(1, { message: "Cidade é obrigatória." }),
    state: z.string().length(2, { message: "Estado deve ter 2 caracteres." }),
  }),
  observations: z
    .string()
    .max(500, { message: "Observações devem ter no máximo 500 caracteres." })
    .optional(),
  date: z.date(),
});

export const appointmentSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Título é obrigatório." })
    .max(100, { message: "Título deve ter no máximo 100 caracteres." }),
  type: z.enum(['maintenance', 'general'], {
    errorMap: () => ({ message: "Tipo de agendamento inválido." })
  }),
  date: z.string().min(1, { message: "Data é obrigatória." }),
  observations: z
    .string()
    .max(500, { message: "Observações devem ter no máximo 500 caracteres." })
    .optional(),
  mileage: kmSchema.optional(),
}).refine((data) => {
  // Se o tipo for manutenção, quilometragem é obrigatória
  if (data.type === 'maintenance') {
    return data.mileage !== undefined;
  }
  return true;
}, {
  message: "Para agendamentos de manutenção, a quilometragem é obrigatória.",
  path: ['mileage'],
});

// Funções de validação utilitárias
export const validateAndParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
};

export const getValidationErrors = <T>(schema: z.ZodSchema<T>, data: unknown): string[] => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return result.error.errors.map(e => e.message);
  }
  return [];
};
