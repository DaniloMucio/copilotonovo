
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addTransaction, updateTransaction, type Transaction, type TransactionInput } from '@/services/transactions';
import { getAddressFromCEP } from '@/services/viacep';
import { getRecipientsByUser, findOrCreateRecipient, type Recipient } from '@/services/recipients';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/context/AuthContext';

const addressSchema = z.object({
    cep: z.string().min(8, 'CEP deve ter 8 dígitos.').max(9, 'CEP inválido'),
    street: z.string().min(1, 'Rua é obrigatória.'),
    number: z.string().min(1, 'Número é obrigatório.'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório.'),
    city: z.string().min(1, 'Cidade é obrigatória.'),
    state: z.string().min(1, 'Estado é obrigatório.'),
});

const deliveryFormSchema = z.object({
    description: z.string().min(3, 'Descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser positivo.'),
    paymentType: z.enum(['À vista', 'A receber']),
    senderCompany: z.string().min(1, "Nome/Empresa do remetente é obrigatório"),
    recipientId: z.string().optional(),
    recipientCompany: z.string().min(1, "Nome/Empresa do destinatário é obrigatório"),
    senderAddress: addressSchema,
    recipientAddress: addressSchema,
    observations: z.string().optional(),
    driverId: z.string().optional(),
});

type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

interface DeliveryFormProps {
    onFormSubmit: () => void;
    transactionToEdit?: Transaction | null;
    drivers?: any[];
    recipients?: Recipient[];
}

export function DeliveryForm({ onFormSubmit, transactionToEdit, drivers = [], recipients = [] }: DeliveryFormProps) {
    const { toast } = useToast();
    const { userData } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Debug logs
    console.log('🔍 DeliveryForm Debug:', {
        userData: userData ? {
            userType: userData.userType,
            displayName: userData.displayName
        } : null,
        driversCount: drivers.length,
        drivers: drivers.map(d => ({
            uid: d.uid,
            displayName: d.displayName,
            isOnline: d.isOnline
        })),
        transactionToEdit: !!transactionToEdit,
        shouldShowDriverSelect: userData?.userType === 'cliente' && !transactionToEdit
    });
    const [isFetchingSenderCep, setIsFetchingSenderCep] = useState(false);
    const [isFetchingRecipientCep, setIsFetchingRecipientCep] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    
    const form = useForm<DeliveryFormValues>({
        resolver: zodResolver(deliveryFormSchema),
        defaultValues: {
            description: '',
            amount: 0,
            paymentType: 'A receber',
            senderCompany: '',
            recipientId: '',
            recipientCompany: '',
            senderAddress: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
            recipientAddress: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
            observations: '',
            driverId: '',
        }
    });
    
     useEffect(() => {
        if (transactionToEdit) {
            form.reset({
                description: transactionToEdit.description,
                amount: transactionToEdit.amount,
                paymentType: transactionToEdit.paymentType || 'A receber',
                senderCompany: transactionToEdit.senderCompany || '',
                recipientCompany: transactionToEdit.recipientCompany || '',
                senderAddress: transactionToEdit.senderAddress || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
                recipientAddress: transactionToEdit.recipientAddress || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
                observations: transactionToEdit.observations || '',
                driverId: transactionToEdit.driverId || '',
            });
        }
    }, [transactionToEdit, form]);

    // Monitorar mudanças nos valores do formulário para detectar perda de dados
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (selectedRecipient && name && name.startsWith('recipient')) {
                console.log('🔍 Mudança detectada no campo do destinatário:', {
                    name,
                    type,
                    newValue: name === 'recipientCompany' ? value.recipientCompany : 
                             name === 'recipientAddress' ? value.recipientAddress :
                             name === 'recipientId' ? value.recipientId : 'N/A',
                    selectedRecipient: selectedRecipient.name
                });
                
                // Verificar se os dados do destinatário foram perdidos e restaurar
                if (name === 'recipientCompany' && value.recipientCompany !== selectedRecipient.name) {
                    console.log('⚠️ ATENÇÃO: Dados do destinatário foram perdidos! Restaurando...');
                    console.log('Valor esperado:', selectedRecipient.name);
                    console.log('Valor atual:', value.recipientCompany);
                    
                    // Restaurar os dados do destinatário
                    form.setValue('recipientCompany', selectedRecipient.name);
                    form.setValue('recipientAddress', selectedRecipient.address);
                }
                
                if (name === 'recipientAddress' && selectedRecipient.address) {
                    const currentAddress = value.recipientAddress;
                    const expectedAddress = selectedRecipient.address;
                    
                    // Verificar se algum campo do endereço foi alterado
                    const addressChanged = Object.keys(expectedAddress).some(key => {
                        const typedKey = key as keyof typeof expectedAddress;
                        return currentAddress && currentAddress[typedKey] !== expectedAddress[typedKey];
                    });
                    
                    if (addressChanged) {
                        console.log('⚠️ ATENÇÃO: Endereço do destinatário foi alterado! Restaurando...');
                        form.setValue('recipientAddress', selectedRecipient.address);
                    }
                }
            }
        });
        
        return () => subscription.unsubscribe();
    }, [form, selectedRecipient]);

    const handleCepSearch = async (cep: string, type: 'sender' | 'recipient') => {
        const cepOnlyNumbers = cep.replace(/\D/g, '');
        if (cepOnlyNumbers.length !== 8) return;

        const setIsFetching = type === 'sender' ? setIsFetchingSenderCep : setIsFetchingRecipientCep;
        setIsFetching(true);

        try {
            const data = await getAddressFromCEP(cepOnlyNumbers);
            if (data.erro) {
                toast({ variant: 'destructive', title: 'CEP não encontrado.' });
                return;
            }
            const addressPath = type === 'sender' ? 'senderAddress' : 'recipientAddress';
            form.setValue(`${addressPath}.street`, data.logradouro);
            form.setValue(`${addressPath}.neighborhood`, data.bairro);
            form.setValue(`${addressPath}.city`, data.localidade);
            form.setValue(`${addressPath}.state`, data.uf);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar CEP.' });
        } finally {
            setIsFetching(false);
        }
    };

    const handleRecipientChange = (recipientId: string) => {
        console.log('🔄 handleRecipientChange chamado com:', recipientId);
        console.log('📋 Estado atual do selectedRecipient:', selectedRecipient);
        
        if (recipientId === 'new-recipient') {
            console.log('🆕 Criando novo destinatário');
            setSelectedRecipient(null);
            form.setValue('recipientId', '');
            form.setValue('recipientCompany', '');
            form.setValue('recipientAddress', { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' });
        } else {
            const recipient = recipients.find(r => r.id === recipientId);
            console.log('🔍 Destinatário encontrado:', recipient);
            if (recipient) {
                console.log('✅ Preenchendo dados do destinatário:', {
                    id: recipient.id,
                    name: recipient.name,
                    address: recipient.address
                });
                setSelectedRecipient(recipient);
                
                // Usar batch para definir todos os valores de uma vez
                form.setValue('recipientId', recipient.id);
                form.setValue('recipientCompany', recipient.name);
                form.setValue('recipientAddress', recipient.address);
                
                // Forçar re-render dos campos do destinatário
                form.trigger(['recipientCompany', 'recipientAddress']);
                
                // Verificar se os dados foram realmente definidos
                setTimeout(() => {
                    const currentValues = form.getValues();
                    console.log('🔍 Valores do formulário após preenchimento:', {
                        recipientId: currentValues.recipientId,
                        recipientCompany: currentValues.recipientCompany,
                        recipientAddress: currentValues.recipientAddress
                    });
                }, 100);
            } else {
                console.log('❌ Destinatário não encontrado');
                setSelectedRecipient(null);
                form.setValue('recipientId', '');
            }
        }
    };

    const onSubmit = async (values: DeliveryFormValues) => {
        const user = auth.currentUser;
        if (!user) {
            toast({ variant: 'destructive', title: 'Usuário não autenticado.' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (userData?.userType === 'cliente' && !values.driverId && !transactionToEdit) {
                toast({ variant: 'destructive', title: 'Selecione um motorista.' });
                setIsSubmitting(false);
                return;
            }

            // Lógica para buscar ou criar destinatário automaticamente
            let finalRecipientData = {
                recipientCompany: values.recipientCompany,
                recipientAddress: values.recipientAddress,
            };

            // Se não há recipientId selecionado, mas há dados do destinatário, busca ou cria automaticamente
            console.log('🔍 Verificando condições para criar destinatário:');
            console.log('- recipientId:', values.recipientId);
            console.log('- recipientCompany:', values.recipientCompany);
            console.log('- recipientAddress.cep:', values.recipientAddress.cep);
            console.log('- recipientAddress completo:', values.recipientAddress);
            
            if (!values.recipientId && values.recipientCompany && values.recipientAddress.cep && values.recipientAddress.cep.length >= 8) {
                console.log('✅ Condições atendidas! Criando/buscando destinatário...');
                try {
                    const recipient = await findOrCreateRecipient(
                        user.uid,
                        values.recipientCompany,
                        values.recipientAddress
                    );
                    finalRecipientData = {
                        recipientCompany: recipient.name,
                        recipientAddress: recipient.address,
                    };
                    toast({ 
                        title: 'Destinatário processado!', 
                        description: recipient.name === values.recipientCompany ? 
                            'Destinatário encontrado nos registros.' : 
                            'Novo destinatário cadastrado automaticamente.' 
                    });
                } catch (error) {
                    console.error('Erro ao processar destinatário:', error);
                    // Continua com os dados originais se houver erro
                }
            } else {
                console.log('❌ Condições NÃO atendidas para criar destinatário');
                console.log('- Motivo: recipientId existe OU dados incompletos');
                console.log('- Verificações:');
                console.log('  - !recipientId:', !values.recipientId);
                console.log('  - recipientCompany:', !!values.recipientCompany);
                console.log('  - recipientAddress.cep:', !!values.recipientAddress.cep);
                console.log('  - cep.length >= 8:', values.recipientAddress.cep?.length >= 8);
            }
            
            const transactionData: TransactionInput = {
                userId: userData?.userType === 'cliente' ? values.driverId! : user.uid,
                clientId: userData?.userType === 'cliente' ? user.uid : undefined,
                assignedDriverId: userData?.userType === 'cliente' ? values.driverId! : undefined,
                type: values.paymentType === 'À vista' ? 'receita' : 'informativo',
                category: 'Entrega',
                date: new Date(),
                deliveryStatus: userData?.userType === 'cliente' ? 'Pendente' : 'Confirmada',
                paymentStatus: values.paymentType === 'À vista' ? 'Pago' : 'Pendente',
                ...values,
                ...finalRecipientData,
            };

            if (transactionToEdit) {
                await updateTransaction(transactionToEdit.id, { ...values, ...finalRecipientData });
                toast({ title: 'Sucesso!', description: 'Entrega atualizada.' });
            } else {
                await addTransaction(transactionData);
                toast({ title: 'Sucesso!', description: 'Entrega registrada.' });
            }
            onFormSubmit();
            form.reset();
            setSelectedRecipient(null);
        } catch (error) {
            console.error("Erro detalhado ao salvar entrega:", error);
            toast({ variant: 'destructive', title: 'Erro ao salvar entrega.', description: 'Verifique o console para mais detalhes' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {userData?.userType === 'cliente' && !transactionToEdit && (
                     <FormField
                        control={form.control}
                        name="driverId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Motorista de Preferência</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                drivers.length === 0 
                                                    ? "Nenhum motorista online disponível" 
                                                    : "Selecione um motorista"
                                            } />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {drivers.length === 0 ? (
                                            <SelectItem value="" disabled>
                                                Nenhum motorista online disponível
                                            </SelectItem>
                                        ) : (
                                            drivers.map(driver => (
                                                <SelectItem key={driver.uid} value={driver.uid}>
                                                    {driver.displayName || driver.name || 'Motorista sem nome'}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                {drivers.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Não há motoristas online no momento. A entrega será atribuída automaticamente quando um motorista ficar disponível.
                                    </p>
                                )}
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Destinatário</FormLabel>
                            <Select onValueChange={handleRecipientChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um destinatário ou deixe em branco para novo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="new-recipient">Novo destinatário</SelectItem>
                                    {recipients.map(recipient => (
                                        <SelectItem key={recipient.id} value={recipient.id}>
                                            {recipient.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Descrição da Entrega</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Entrega (R$)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onFocus={(e) => {
                                        if (Number(field.value) === 0) {
                                            field.onChange('');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        field.onBlur();
                                        if (e.target.value === '') {
                                            field.onChange(0);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-8">
                    <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Tipo de Pagamento</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="À vista" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Pagamento à vista
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="A receber" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Pagamento a receber
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Remetente</h3>
                        <Separator />
                        <FormField control={form.control} name="senderCompany" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Empresa/Nome</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        disabled={false}
                                        className=""
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="senderAddress.cep" render={({ field }) => (
                             <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            {...field} 
                                            type="tel" 
                                            inputMode="numeric" 
                                            disabled={false}
                                            className=""
                                            onBlur={(e) => handleCepSearch(e.target.value, 'sender')}
                                        />
                                        {isFetchingSenderCep && <Loader2 className="animate-spin h-4 w-4" />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                        )} />
                        <FormField control={form.control} name="senderAddress.street" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rua</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        disabled={false}
                                        className=""
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <FormField control={form.control} name="senderAddress.number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={false}
                                            className=""
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="senderAddress.neighborhood" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={false}
                                            className=""
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="senderAddress.city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={false}
                                            className=""
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="senderAddress.state" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={false}
                                            className=""
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Destinatário</h3>
                        <Separator />
                        <FormField control={form.control} name="recipientCompany" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Empresa/Nome</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        disabled={selectedRecipient !== null}
                                        className={selectedRecipient ? 'bg-gray-100' : ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="recipientAddress.cep" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            {...field} 
                                            type="tel" 
                                            inputMode="numeric" 
                                            disabled={selectedRecipient !== null}
                                            className={selectedRecipient ? 'bg-gray-100' : ''}
                                            onBlur={(e) => !selectedRecipient && handleCepSearch(e.target.value, 'recipient')}
                                        />
                                        {isFetchingRecipientCep && <Loader2 className="animate-spin h-4 w-4" />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="recipientAddress.street" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rua</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        disabled={selectedRecipient !== null}
                                        className={selectedRecipient ? 'bg-gray-100' : ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="recipientAddress.number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={selectedRecipient !== null}
                                            className={selectedRecipient ? 'bg-gray-100' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="recipientAddress.neighborhood" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={selectedRecipient !== null}
                                            className={selectedRecipient ? 'bg-gray-100' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FormField control={form.control} name="recipientAddress.city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={selectedRecipient !== null}
                                            className={selectedRecipient ? 'bg-gray-100' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="recipientAddress.state" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            disabled={selectedRecipient !== null}
                                            className={selectedRecipient ? 'bg-gray-100' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <FormField control={form.control} name="observations" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observações</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage />
                    </FormItem>
                )} />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {transactionToEdit ? 'Salvar Alterações' : 'Registrar Entrega'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
