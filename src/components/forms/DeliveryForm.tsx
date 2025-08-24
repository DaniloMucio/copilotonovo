
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addTransaction, updateTransaction, type Transaction, type TransactionInput } from '@/services/transactions';
import { getAddressFromCEP } from '@/services/viacep';
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
}

export function DeliveryForm({ onFormSubmit, transactionToEdit, drivers = [] }: DeliveryFormProps) {
    const { toast } = useToast();
    const { userData } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingSenderCep, setIsFetchingSenderCep] = useState(false);
    const [isFetchingRecipientCep, setIsFetchingRecipientCep] = useState(false);
    
    const form = useForm<DeliveryFormValues>({
        resolver: zodResolver(deliveryFormSchema),
        defaultValues: {
            description: '',
            amount: 0,
            paymentType: 'A receber',
            senderCompany: '',
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
            
            const transactionData: TransactionInput = {
                userId: userData?.userType === 'cliente' ? values.driverId! : user.uid,
                clientId: userData?.userType === 'cliente' ? user.uid : undefined,
                type: values.paymentType === 'À vista' ? 'receita' : 'informativo',
                category: 'Entrega',
                date: new Date(),
                deliveryStatus: userData?.userType === 'cliente' ? 'Pendente' : 'Confirmada',
                paymentStatus: values.paymentType === 'À vista' ? 'Pago' : 'Pendente',
                ...values,
            };

            if (transactionToEdit) {
                await updateTransaction(transactionToEdit.id, { ...values });
                toast({ title: 'Sucesso!', description: 'Entrega atualizada.' });
            } else {
                await addTransaction(transactionData);
                toast({ title: 'Sucesso!', description: 'Entrega registrada.' });
            }
            onFormSubmit();
            form.reset();
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
                                            <SelectValue placeholder="Selecione um motorista" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {drivers.map(driver => (
                                            <SelectItem key={driver.uid} value={driver.uid}>
                                                {driver.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
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
                            <FormItem><FormLabel>Empresa/Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="senderAddress.cep" render={({ field }) => (
                             <FormItem><FormLabel>CEP</FormLabel><FormControl>
                                <div className="flex items-center gap-2">
                                    <Input {...field} type="tel" inputMode="numeric" onBlur={(e) => handleCepSearch(e.target.value, 'sender')}/>
                                    {isFetchingSenderCep && <Loader2 className="animate-spin h-4 w-4" />}
                                </div>
                             </FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="senderAddress.street" render={({ field }) => (
                            <FormItem><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <FormField control={form.control} name="senderAddress.number" render={({ field }) => (
                                <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="senderAddress.neighborhood" render={({ field }) => (
                                <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="senderAddress.city" render={({ field }) => (
                                <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="senderAddress.state" render={({ field }) => (
                                <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Destinatário</h3>
                        <Separator />
                        <FormField control={form.control} name="recipientCompany" render={({ field }) => (
                            <FormItem><FormLabel>Empresa/Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="recipientAddress.cep" render={({ field }) => (
                            <FormItem><FormLabel>CEP</FormLabel><FormControl>
                                <div className="flex items-center gap-2">
                                     <Input {...field} type="tel" inputMode="numeric" onBlur={(e) => handleCepSearch(e.target.value, 'recipient')}/>
                                     {isFetchingRecipientCep && <Loader2 className="animate-spin h-4 w-4" />}
                                </div>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="recipientAddress.street" render={({ field }) => (
                            <FormItem><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="recipientAddress.number" render={({ field }) => (
                                <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="recipientAddress.neighborhood" render={({ field }) => (
                                <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FormField control={form.control} name="recipientAddress.city" render={({ field }) => (
                                <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="recipientAddress.state" render={({ field }) => (
                                <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
