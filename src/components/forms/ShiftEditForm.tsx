
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';
import { WorkShift, updateShift } from '@/services/workShifts';
import { useEffect, useState } from 'react';
import { reauthenticateUser } from '@/services/auth';

const shiftEditSchema = z.object({
  startKm: z.coerce.number().min(0, 'KM Inicial deve ser positivo.'),
  endKm: z.coerce.number().optional().nullable(),
  startTime: z.date({ required_error: 'Data de início é obrigatória.' }),
  endTime: z.date().optional().nullable(),
  password: z.string().min(6, 'Senha é obrigatória e deve ter no mínimo 6 caracteres.'),
}).refine(data => !data.endKm || data.endKm >= data.startKm, {
    message: "KM Final não pode ser menor que o KM Inicial.",
    path: ["endKm"],
});

type ShiftEditFormValues = z.infer<typeof shiftEditSchema>;

interface ShiftEditFormProps {
    shift: WorkShift;
    onFormSubmit: () => void;
}

export function ShiftEditForm({ shift, onFormSubmit }: ShiftEditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShiftEditFormValues>({
    resolver: zodResolver(shiftEditSchema),
    defaultValues: {
      startKm: shift.startKm,
      endKm: shift.endKm,
      startTime: shift.startTime.toDate(),
      endTime: shift.endTime?.toDate(),
      password: '',
    },
  });

  async function onSubmit(values: ShiftEditFormValues) {
    setIsSubmitting(true);
    try {
        await reauthenticateUser(values.password);
        
        const dataToUpdate = {
            startKm: values.startKm,
            endKm: values.endKm,
            startTime: values.startTime,
            endTime: values.endTime,
        };

        await updateShift(shift.id, dataToUpdate);

        toast({
            title: 'Sucesso!',
            description: 'Jornada atualizada.',
        });
        onFormSubmit();
    } catch (error: any) {
        let description = "Ocorreu um problema ao atualizar a jornada.";
        if (error.message.includes('wrong-password')) {
            description = "Senha incorreta. Tente novamente.";
        }
        toast({
            variant: 'destructive',
            title: 'Erro ao atualizar',
            description,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="startKm"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>KM Inicial</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="endKm"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>KM Final</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Início da Jornada</FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={'outline'}
                        className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                    >
                        {field.value ? format(field.value, 'PPP HH:mm', { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl bg-white border border-gray-200" align="start">
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Fim da Jornada</FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={'outline'}
                        className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                    >
                        {field.value ? format(field.value, 'PPP HH:mm', { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl bg-white border border-gray-200" align="start">
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Sua Senha</FormLabel>
                <FormControl>
                <Input type="password" {...field} placeholder="Digite sua senha para confirmar" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
