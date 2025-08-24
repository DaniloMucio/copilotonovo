
'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { Transaction } from '@/services/transactions';
import type { User } from 'firebase/auth';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { WorkShift } from '@/services/workShifts';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface ReportsManagerProps {
    transactions: Transaction[];
    shifts: WorkShift[];
    user: User;
}

export function ReportsManager({ transactions, shifts, user }: ReportsManagerProps) {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: last30Days,
      to: today,
    });

    const [includeIncome, setIncludeIncome] = useState(true);
    const [includeExpenses, setIncludeExpenses] = useState(true);
    const [includeShifts, setIncludeShifts] = useState(true);
    const [includePaidDeliveries, setIncludePaidDeliveries] = useState(true);
    const [includeUnpaidDeliveries, setIncludeUnpaidDeliveries] = useState(true);

    const filteredTransactions = transactions.filter(t => {
        if (!dateRange || !dateRange.from) return true;
        const transactionDate = t.date.toDate();
        const toDate = dateRange.to ? dateRange.to : dateRange.from;
        toDate.setHours(23, 59, 59, 999);
        return transactionDate >= dateRange.from && transactionDate <= toDate;
    });

    const filteredShifts = shifts.filter(s => {
        if (!dateRange || !dateRange.from) return true;
        const shiftStartDate = s.startTime.toDate();
        const toDate = dateRange.to ? dateRange.to : dateRange.from;
        toDate.setHours(23, 59, 59, 999);
        return shiftStartDate >= dateRange.from && shiftStartDate <= toDate;
    })

    const totalIncome = filteredTransactions
        .filter((t) => t.type === 'receita')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'despesa')
        .reduce((acc, curr) => acc + curr.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;

    const formatDuration = (start: Date, end: Date | null) => {
        if (!end) return 'Em andamento';
        return formatDistanceToNowStrict(end, { locale: ptBR, unit: 'minute', addSuffix: false });
    }

    const exportPDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        let finalY = 0;

        // Title
        doc.setFontSize(18);
        doc.text(`Relatório Financeiro e de Jornadas - ${user.displayName}`, 14, 22);
        
        // Subtitle
        doc.setFontSize(11);
        doc.setTextColor(100);
        const fromDate = dateRange?.from ? format(dateRange.from, 'P', { locale: ptBR }) : '';
        const toDate = dateRange?.to ? format(dateRange.to, 'P', { locale: ptBR }) : fromDate;
        doc.text(`Período: ${fromDate} a ${toDate}`, 14, 30);
        
        // Summary
        if (includeIncome || includeExpenses) {
            doc.setFontSize(12);
            doc.text('Resumo Financeiro do Período', 14, 45);
            
            const summaryLines = [];
            if (includeIncome) {
                summaryLines.push(`Receita Total: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            }
            if (includeExpenses) {
                summaryLines.push(`Despesa Total: ${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            }
            if (includeIncome && includeExpenses) {
                summaryLines.push(`Saldo Líquido: ${netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            }
            
            const summaryText = summaryLines.join('\n');
            doc.setFontSize(10);
            doc.text(summaryText, 14, 52);
        }


        // Transactions Table
        if (includeIncome || includeExpenses) {
            const transTableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
            const transTableRows: (string | number)[][] = [];

            const transactionsToExport = filteredTransactions.filter(transaction => {
                if (includeIncome && transaction.type === 'receita') return true;
                if (includeExpenses && transaction.type === 'despesa') return true;
                return false;
            });

            transactionsToExport.forEach(transaction => {
                const transactionData = [
                    format(transaction.date.toDate(), 'dd/MM/yyyy'),
                    transaction.description,
                    transaction.category,
                    transaction.type === 'receita' ? 'Receita' : 'Despesa',
                    transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ];
                transTableRows.push(transactionData);
            });
            
            let startY = 80;
            if (!includeIncome && !includeExpenses) {
                startY = 40;
            } else if (!includeIncome || !includeExpenses) {
                startY = 70;
            }


            (doc as any).autoTable({
                head: [transTableColumn],
                body: transTableRows,
                startY: startY,
                headStyles: { fillColor: [22, 163, 74] },
                didDrawPage: function(data: any) {
                    const str = "Página " + (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(10);
                    doc.text(str, data.settings.margin.left, pageHeight - 10);
                },
                didParseCell: function(data: any) {
                    if (data.section === 'body' && data.column.dataKey === 4) {
                         const cellText = transTableRows[data.row.index][3];
                        if (cellText === 'Despesa') {
                            data.cell.styles.textColor = [220, 38, 38];
                        } else {
                            data.cell.styles.textColor = [22, 163, 74];
                        }
                    }
                },
                willDrawPage: function(data: any) {
                    finalY = data.cursor.y;
                }
            });
            
            finalY = (doc as any).lastAutoTable.finalY || finalY;
        }

        // Deliveries Table
        if (includePaidDeliveries || includeUnpaidDeliveries) {
            const deliveriesTableColumn = ["Data", "Descrição", "Remetente", "Destinatário", "Status Pgto.", "Valor"];
            const deliveriesTableRows: (string | number)[][] = [];

            const deliveriesToExport = filteredTransactions.filter(transaction => {
                if (transaction.category !== 'Entrega') return false;
                if (includePaidDeliveries && transaction.paymentStatus === 'Pago') return true;
                if (includeUnpaidDeliveries && transaction.paymentStatus === 'Pendente') return true;
                return false;
            });

            deliveriesToExport.forEach(delivery => {
                const deliveryData = [
                    format(delivery.date.toDate(), 'dd/MM/yyyy'),
                    delivery.description || '',
                    delivery.senderCompany || '',
                    delivery.recipientCompany || '',
                    delivery.paymentStatus || '',
                    delivery.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ];
                deliveriesTableRows.push(deliveryData);
            });

            let startY = finalY + 15;
            if (finalY === 0) {
                startY = 40;
            }
            
            doc.setFontSize(12);
            doc.text('Relatório de Entregas', 14, startY);


            (doc as any).autoTable({
                head: [deliveriesTableColumn],
                body: deliveriesTableRows,
                startY: startY + 5,
                headStyles: { fillColor: [100, 100, 235] },
                 didDrawPage: function(data: any) {
                    const str = "Página " + (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(10);
                    doc.text(str, data.settings.margin.left, pageHeight - 10);
                }
            });
            finalY = (doc as any).lastAutoTable.finalY || finalY;
        }


        // Shifts Table
        if (includeShifts) {
            const shiftsTableColumn = ["Data", "Duração", "KM Inicial", "KM Final", "KM Rodados", "Status"];
            const shiftsTableRows: (string | number)[][] = [];

            filteredShifts.forEach(shift => {
                const kmRodados = shift.endKm && shift.startKm ? shift.endKm - shift.startKm : 0;
                const shiftData = [
                    format(shift.startTime.toDate(), 'dd/MM/yyyy'),
                    formatDuration(shift.startTime.toDate(), shift.endTime ? shift.endTime.toDate() : null),
                    `${shift.startKm.toLocaleString('pt-BR')} km`,
                    shift.endKm ? `${shift.endKm.toLocaleString('pt-BR')} km` : '-',
                    `${kmRodados.toLocaleString('pt-BR')} km`,
                    shift.status === 'completed' ? 'Finalizada' : 'Ativa'
                ];
                shiftsTableRows.push(shiftData);
            });
            
            let startY = finalY + 15;
            if (finalY === 0) {
                startY = 40;
            }

            doc.setFontSize(12);
            doc.text('Relatório de Jornadas', 14, startY);

            (doc as any).autoTable({
                head: [shiftsTableColumn],
                body: shiftsTableRows,
                startY: startY + 5,
                headStyles: { fillColor: [37, 99, 235] },
                 didDrawPage: function(data: any) {
                    const str = "Página " + (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(10);
                    doc.text(str, data.settings.margin.left, pageHeight - 10);
                }
            });
        }

        doc.save(`relatorio_completo_${user.displayName?.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }

    const transactionsToDisplay = filteredTransactions.filter(t => {
        if (t.category === 'Entrega') return false;
        if (includeIncome && t.type === 'receita') return true;
        if (includeExpenses && t.type === 'despesa') return true;
        return false;
    });

    const deliveriesToDisplay = filteredTransactions.filter(t => {
        if (t.category !== 'Entrega') return false;
        if (includePaidDeliveries && t.paymentStatus === 'Pago') return true;
        if (includeUnpaidDeliveries && t.paymentStatus === 'Pendente') return true;
        return false;
    });

    const shiftsToDisplay = includeShifts ? filteredShifts : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={exportPDF}>Exportar PDF</Button>
                </div>
                <div className="flex flex-wrap items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeIncome" checked={includeIncome} onCheckedChange={(c) => setIncludeIncome(c as boolean)} />
                        <Label htmlFor="includeIncome">Receitas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeExpenses" checked={includeExpenses} onCheckedChange={(c) => setIncludeExpenses(c as boolean)} />
                        <Label htmlFor="includeExpenses">Despesas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeShifts" checked={includeShifts} onCheckedChange={(c) => setIncludeShifts(c as boolean)} />
                        <Label htmlFor="includeShifts">Jornadas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includePaidDeliveries" checked={includePaidDeliveries} onCheckedChange={(c) => setIncludePaidDeliveries(c as boolean)} />
                        <Label htmlFor="includePaidDeliveries">Entregas Pagas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeUnpaidDeliveries" checked={includeUnpaidDeliveries} onCheckedChange={(c) => setIncludeUnpaidDeliveries(c as boolean)} />
                        <Label htmlFor="includeUnpaidDeliveries">Entregas a Receber</Label>
                    </div>
                </div>
            </div>

            { (includeIncome || includeExpenses) && <Card>
                <CardHeader>
                    <CardTitle>Resumo do Período Selecionado</CardTitle>
                    <CardDescription>
                        {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : ''}
                        {dateRange?.to ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                     { includeIncome && <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-medium text-emerald-800">Receita Total</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>}
                    { includeExpenses && <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-medium text-rose-800">Despesa Total</p>
                        <p className="text-2xl font-bold text-rose-600">
                            {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>}
                    { (includeIncome && includeExpenses) && <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-medium">Saldo Líquido</p>
                        <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-gray-800' : 'text-rose-600'}`}>
                            {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>}
                </CardContent>
            </Card>}

            { (includeIncome || includeExpenses) && <Card>
                <CardHeader>
                    <CardTitle>Detalhes das Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactionsToDisplay.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsToDisplay.map(t => (
                                        <TableRow key={t.id} className="border-b">
                                            <TableCell>{format(t.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell>{t.category}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type === 'receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {t.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`px-4 py-2 text-right font-medium ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'despesa' && '- '}
                                                {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma transação no período selecionado.</p>
                    )}
                </CardContent>
            </Card>}

            {(includePaidDeliveries || includeUnpaidDeliveries) && <Card>
                <CardHeader>
                    <CardTitle>Detalhes das Entregas</CardTitle>
                </CardHeader>
                <CardContent>
                    {deliveriesToDisplay.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Remetente</TableHead>
                                        <TableHead>Destinatário</TableHead>
                                        <TableHead>Status Pgto.</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deliveriesToDisplay.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{format(d.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{d.description}</TableCell>
                                            <TableCell>{d.senderCompany}</TableCell>
                                            <TableCell>{d.recipientCompany}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.paymentStatus === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {d.paymentStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma entrega no período selecionado.</p>
                    )}
                </CardContent>
            </Card>}

            { includeShifts && <Card>
                <CardHeader>
                    <CardTitle>Detalhes das Jornadas</CardTitle>
                </CardHeader>
                <CardContent>
                     {shiftsToDisplay.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Duração</TableHead>
                                        <TableHead>KM Inicial</TableHead>
                                        <TableHead>KM Final</TableHead>
                                        <TableHead>KM Rodados</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shiftsToDisplay.map(s => {
                                        const kmRodados = s.endKm ? s.endKm - s.startKm : 0;
                                        return (
                                        <TableRow key={s.id} className="border-b">
                                            <TableCell>{format(s.startTime.toDate(), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{formatDuration(s.startTime.toDate(), s.endTime ? s.endTime.toDate() : null)}</TableCell>
                                            <TableCell>{s.startKm.toLocaleString('pt-BR')} km</TableCell>
                                            <TableCell>{s.endKm ? `${s.endKm.toLocaleString('pt-BR')} km` : '—'}</TableCell>
                                            <TableCell>{kmRodados.toLocaleString('pt-BR')} km</TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma jornada no período selecionado.</p>
                    )}
                </CardContent>
            </Card> }
        </div>
    );
}
