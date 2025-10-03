
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { deleteTransaction, updateTransaction, type Transaction, type Address } from '@/services/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Map, Pencil, Trash2, Check, Loader2, DollarSign, X, ThumbsUp, Eye } from 'lucide-react';
import { SimpleTrackingButton } from './SimpleTrackingButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { DeliveryForm } from './forms/DeliveryForm';
import { Badge } from './ui/badge';


interface DeliveryHistoryProps {
    onAction: () => void;
    deliveries: Transaction[];
    loading: boolean;
    isHistoryTab?: boolean;
    onRespond?: (deliveryId: string, accept: boolean) => void;
}

export function DeliveryHistory({ onAction, deliveries, loading, isHistoryTab = false, onRespond }: DeliveryHistoryProps) {
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

    const handleEditClick = (delivery: Transaction) => {
        setTransactionToEdit(delivery);
        setIsEditDialogOpen(true);
    };

    const handleCardClick = (delivery: Transaction) => {
        setSelectedDeliveryId(delivery.id!);
        setTrackingModalOpen(true);
    };

    const handleDelete = async (transactionId: string) => {
        try {
            await deleteTransaction(transactionId);
            toast({ title: "Sucesso!", description: "Entrega excluída." });
            
            // Fechar modal de rastreamento se a entrega excluída for a mesma sendo exibida
            if (selectedDeliveryId === transactionId) {
                setTrackingModalOpen(false);
                setSelectedDeliveryId(null);
            }
            
            onAction();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Ocorreu um problema ao excluir a entrega." });
        }
    };
    
    const handleFormSubmit = () => {
        setIsEditDialogOpen(false);
        setTransactionToEdit(null);
        onAction();
    }

    const handlePayment = async (delivery: Transaction) => {
        setUpdatingStatusId(delivery.id);
        try {
            await updateTransaction(delivery.id, {
                type: 'receita',
                paymentStatus: 'Pago',
            });
            toast({ title: "Sucesso!", description: "Pagamento registrado." });
            onAction();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar o pagamento." });
        } finally {
            setUpdatingStatusId(null);
        }
    }
    
    const handleStatusUpdate = async (delivery: Transaction) => {
        setUpdatingStatusId(delivery.id);
        try {
            let newStatus: Transaction['deliveryStatus'] = 'A caminho';
            let toastMessage = 'Status atualizado para "A caminho".';

            if (delivery.deliveryStatus === 'Confirmada') {
                openMaps(delivery.recipientAddress);
                newStatus = 'A caminho';
                toastMessage = 'Status atualizado para "A caminho".';
            } else if (delivery.deliveryStatus === 'A caminho') {
                newStatus = 'Entregue';
                toastMessage = 'Entrega finalizada com sucesso!';
            } else {
                setUpdatingStatusId(null);
                return;
            }

            await updateTransaction(delivery.id, { deliveryStatus: newStatus });
            toast({ title: "Sucesso!", description: toastMessage });
            onAction();

        } catch (error) {
             toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o status." });
        } finally {
            setUpdatingStatusId(null);
        }
    }


    const openMaps = (recipientAddress?: Address) => {
        if (!recipientAddress) {
            toast({ variant: 'destructive', title: 'Endereço do destinatário incompleto' });
            return;
        }

        const formatAddress = (addr: Address) => 
            `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city} - ${addr.state}, ${addr.cep}`;

        const destination = encodeURIComponent(formatAddress(recipientAddress));
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const origin = `${latitude},${longitude}`;
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
                    window.open(url, '_blank');
                },
                (error) => {
                    console.error("Erro ao obter localização: ", error);
                    toast({
                        variant: 'default',
                        title: 'Não foi possível obter a sua localização',
                        description: "A rota será traçada a partir do endereço de partida padrão.",
                    });
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
                    window.open(url, '_blank');
                }
            );
        } else {
            toast({
                variant: 'destructive',
                title: 'Geolocalização não suportada',
                description: 'Seu navegador não suporta geolocalização.',
            });
        }
    };


     const getStatusBadgeVariant = (status: Transaction['deliveryStatus']) => {
        switch (status) {
            case 'Pendente': return 'default';
            case 'Confirmada': return 'info';
            case 'A caminho': return 'secondary';
            case 'Entregue': return 'success';
            case 'Recusada': return 'destructive';
            default: return 'outline';
        }
    }

    const renderStatusButton = (delivery: Transaction) => {
        const isUpdating = updatingStatusId === delivery.id;

        if (isUpdating) {
            return <Button variant="ghost" size="icon" disabled><Loader2 className="h-4 w-4 animate-spin"/></Button>;
        }

        if (onRespond && delivery.deliveryStatus === 'Pendente') {
            return (
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRespond(delivery.id, true);
                        }} 
                        title="Aceitar Entrega"
                    >
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRespond(delivery.id, false);
                        }} 
                        title="Recusar Entrega"
                    >
                        <X className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            )
        }
        
        if (delivery.deliveryStatus === 'Entregue' && delivery.paymentStatus === 'Pendente') {
            return (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePayment(delivery);
                    }} 
                    title="Registrar Pagamento"
                    disabled={isHistoryTab}
                >
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                </Button>
            );
        }


        switch (delivery.deliveryStatus) {
            case 'A caminho':
                return (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(delivery);
                        }} 
                        title="Marcar como Entregue"
                    >
                        <Check className="h-4 w-4 text-red-600" />
                    </Button>
                );
            case 'Entregue':
                 return (
                    <Button variant="ghost" size="icon" disabled title="Entrega Finalizada">
                        <Check className="h-4 w-4 text-green-600" />
                    </Button>
                );
            case 'Confirmada':
                return (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(delivery);
                        }} 
                        title="Iniciar Rota"
                    >
                        <Map className="h-4 w-4 text-blue-600" />
                    </Button>
                );
            default:
                return null;
        }
    }
    
    if (loading) {
        return <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-muted rounded-lg animate-pulse" />
            ))}
        </div>;
    }

    if (deliveries.length === 0) {
        return <p className="text-center text-muted-foreground">Nenhuma entrega registrada ainda.</p>;
    }
    
    const totalAmount = deliveries.reduce((acc, delivery) => acc + delivery.amount, 0);

    return (
        <div className="space-y-4">
            {/* Tabela para Desktop */}
            <div className="hidden md:block">
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Remetente</TableHead>
                                <TableHead>Destinatário</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliveries.map((delivery, index) => (
                                <TableRow key={delivery.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{format(delivery.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{delivery.description}</TableCell>
                                    <TableCell>{delivery.senderCompany}</TableCell>
                                    <TableCell>{delivery.recipientCompany}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(delivery.deliveryStatus)}>
                                            {delivery.deliveryStatus || 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-600 font-medium">
                                        {delivery.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </TableCell>
                                    <TableCell className="text-center space-x-1">
                                         {renderStatusButton(delivery)}
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(delivery)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a entrega.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(delivery.id)}>Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6} className="text-right font-bold">Total</TableCell>
                                <TableCell className="text-right text-emerald-600 font-bold">
                                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
            {/* Acordeão para Mobile */}
            <div className="block md:hidden">
                <Accordion type="single" collapsible className="w-full">
                    {deliveries.map((delivery, index) => (
                        <AccordionItem key={delivery.id} value={delivery.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between w-full pr-4 items-center">
                                    <div className="flex items-center gap-4">
                                         <span className="font-bold text-lg">{index + 1}</span>
                                        <div className="flex flex-col text-left">
                                            <span className="font-semibold">{delivery.description}</span>
                                            <span className="text-sm text-muted-foreground">{format(delivery.date.toDate(), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCardClick(delivery);
                                            }}
                                            title="Abrir Rastreamento"
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Badge variant={getStatusBadgeVariant(delivery.deliveryStatus)}>
                                            {delivery.deliveryStatus || 'Pendente'}
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 px-4 py-2 bg-muted/50 rounded-md">
                                    <div className="flex justify-between items-center">
                                         <p className="text-lg font-bold text-emerald-600">{delivery.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                          <div className="flex items-center">
                                            <div onClick={(e) => e.stopPropagation()}>
                                              {renderStatusButton(delivery)}
                                            </div>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(delivery);
                                              }}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(delivery.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <p className="font-semibold">Remetente:</p>
                                        <p>{delivery.senderCompany}</p>
                                        <p>{`${delivery.senderAddress?.street || ''}, ${delivery.senderAddress?.number || ''}`}</p>
                                        <p>{`${delivery.senderAddress?.city || ''}, ${delivery.senderAddress?.state || ''}`}</p>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <p className="font-semibold">Destinatário:</p>
                                        <p>{delivery.recipientCompany}</p>
                                        <p>{`${delivery.recipientAddress?.street || ''}, ${delivery.recipientAddress?.number || ''}`}</p>
                                        <p>{`${delivery.recipientAddress?.city || ''}, ${delivery.recipientAddress?.state || ''}`}</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                 <div className="mt-4 p-4 bg-muted rounded-lg text-right">
                    <span className="font-bold text-lg">Total: </span>
                    <span className="font-bold text-lg text-emerald-600">
                        {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>
             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Editar Entrega</DialogTitle>
                        <DialogDescription>Altere os detalhes da sua entrega.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6">
                        <DeliveryForm 
                            onFormSubmit={handleFormSubmit} 
                            transactionToEdit={transactionToEdit}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Rastreamento */}
            {trackingModalOpen && selectedDeliveryId && (
                <SimpleTrackingButton 
                    transactionId={selectedDeliveryId}
                    onClose={() => {
                        setTrackingModalOpen(false);
                        setSelectedDeliveryId(null);
                    }}
                />
            )}
        </div>
    );
}
