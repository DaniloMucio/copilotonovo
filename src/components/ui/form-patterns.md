# Padrões de Formulários - Sem Transparência

## 🎨 Padrão Visual Obrigatório

Todos os formulários devem seguir este padrão para garantir legibilidade e experiência consistente:

### 📝 Inputs (Input)
```tsx
<Input 
  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
  // ... outras props
/>
```

### 📋 Selects (Dropdown)
```tsx
<Select>
  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent className="bg-white border border-gray-200 shadow-lg">
    <SelectItem value="option1" className="hover:bg-gray-50">Opção 1</SelectItem>
    <SelectItem value="option2" className="hover:bg-gray-50">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

### 📄 Textareas
```tsx
<Textarea 
  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
  // ... outras props
/>
```

## 🎯 Classes Obrigatórias

### ✅ Inputs e Textareas:
- `bg-white` - Fundo branco sólido
- `border-gray-300` - Borda cinza padrão
- `focus:border-blue-500` - Borda azul no foco
- `focus:ring-blue-500` - Anel azul no foco

### ✅ Selects:
- **SelectTrigger**: `bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500`
- **SelectContent**: `bg-white border border-gray-200 shadow-lg`
- **SelectItem**: `hover:bg-gray-50`

## 🚫 O que NÃO fazer

### ❌ Evitar:
- Campos sem `bg-white`
- Transparência em formulários
- Bordas indefinidas
- Contraste insuficiente
- Classes que causem transparência

## 📋 Checklist para Novos Formulários

- [ ] Todos os inputs têm `bg-white`
- [ ] Todos os selects têm fundo branco
- [ ] Bordas bem definidas (`border-gray-300`)
- [ ] Foco azul (`focus:border-blue-500 focus:ring-blue-500`)
- [ ] Hover effects nos dropdowns
- [ ] Teste de legibilidade realizado
- [ ] Responsividade mantida

## 🎨 Exemplo Completo

```tsx
export function ExampleForm() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input 
          id="name"
          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select>
          <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="option1" className="hover:bg-gray-50">Opção 1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description"
          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </form>
  );
}
```

## 🔧 Implementação Automática

Para aplicar automaticamente em todos os formulários existentes:

1. Buscar por `<Input` sem `bg-white`
2. Buscar por `<SelectTrigger` sem classes de estilo
3. Buscar por `<Textarea` sem `bg-white`
4. Aplicar as classes padrão
5. Testar visualmente

---

**Este padrão garante consistência visual e excelente experiência do usuário em todos os formulários do sistema.**
