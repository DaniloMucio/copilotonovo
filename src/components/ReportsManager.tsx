
'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
import { Download, Mail, MessageCircle } from 'lucide-react';

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

    const exportToExcel = () => {
        try {
            // Criar workbook
            const wb = XLSX.utils.book_new();
            
            // Dados do resumo
            const summaryData = [];
            if (includeIncome || includeExpenses) {
                summaryData.push(['Resumo Financeiro do Período']);
                summaryData.push(['']);
                if (includeIncome) {
                    summaryData.push(['Receita Total', totalIncome]);
                }
                if (includeExpenses) {
                    summaryData.push(['Despesa Total', totalExpenses]);
                }
                if (includeIncome && includeExpenses) {
                    summaryData.push(['Saldo Líquido', netBalance]);
                }
                summaryData.push(['']);
                summaryData.push(['Período', `${dateRange?.from ? format(dateRange.from, 'P', { locale: ptBR }) : ''} a ${dateRange?.to ? format(dateRange.to, 'P', { locale: ptBR }) : ''}`]);
                summaryData.push(['Gerado em', format(new Date(), 'dd/MM/yyyy HH:mm')]);
            }
            
            const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWS, 'Resumo');
            
            // Dados das transações
            if (includeIncome || includeExpenses) {
                const transData = [
                    ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']
                ];
                
                const transactionsToExport = filteredTransactions.filter(transaction => {
                    if (includeIncome && transaction.type === 'receita') return true;
                    if (includeExpenses && transaction.type === 'despesa') return true;
                    return false;
                });
                
                transactionsToExport.forEach(transaction => {
                    transData.push([
                        format(transaction.date.toDate(), 'dd/MM/yyyy'),
                        transaction.description,
                        transaction.category,
                        transaction.type === 'receita' ? 'Receita' : 'Despesa',
                        transaction.amount.toString()
                    ]);
                });
                
                const transWS = XLSX.utils.aoa_to_sheet(transData);
                XLSX.utils.book_append_sheet(wb, transWS, 'Transações');
            }
            
            // Dados das entregas
            if (includePaidDeliveries || includeUnpaidDeliveries) {
                const deliveriesData = [
                    ['Data', 'Descrição', 'Remetente', 'Destinatário', 'Status Pgto.', 'Valor']
                ];
                
                const deliveriesToExport = filteredTransactions.filter(transaction => {
                    if (transaction.category !== 'Entrega') return false;
                    if (includePaidDeliveries && transaction.paymentStatus === 'Pago') return true;
                    if (includeUnpaidDeliveries && transaction.paymentStatus === 'Pendente') return true;
                    return false;
                });
                
                deliveriesToExport.forEach(delivery => {
                    deliveriesData.push([
                        format(delivery.date.toDate(), 'dd/MM/yyyy'),
                        delivery.description || '',
                        delivery.senderCompany || '',
                        delivery.recipientCompany || '',
                        delivery.paymentStatus || '',
                        delivery.amount.toString()
                    ]);
                });
                
                const deliveriesWS = XLSX.utils.aoa_to_sheet(deliveriesData);
                XLSX.utils.book_append_sheet(wb, deliveriesWS, 'Entregas');
            }
            
            // Dados das jornadas
            if (includeShifts) {
                const shiftsData = [
                    ['Data', 'Duração', 'KM Inicial', 'KM Final', 'KM Rodados', 'Status']
                ];
                
                filteredShifts.forEach(shift => {
                    const kmRodados = shift.endKm && shift.startKm ? shift.endKm - shift.startKm : 0;
                    shiftsData.push([
                        format(shift.startTime.toDate(), 'dd/MM/yyyy'),
                        formatDuration(shift.startTime.toDate(), shift.endTime ? shift.endTime.toDate() : null),
                        shift.startKm.toString(),
                        shift.endKm ? shift.endKm.toString() : '',
                        kmRodados.toString(),
                        shift.status === 'completed' ? 'Finalizada' : 'Ativa'
                    ]);
                });
                
                const shiftsWS = XLSX.utils.aoa_to_sheet(shiftsData);
                XLSX.utils.book_append_sheet(wb, shiftsWS, 'Jornadas');
            }
            
            // Salvar arquivo
            const fileName = `relatorio_completo_${user.displayName?.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            alert('Erro ao exportar Excel. Tente novamente.');
        }
    };

    const sendReport = () => {
        try {
            // Gerar PDF temporário
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

            // Converter para blob
            const pdfBlob = doc.output('blob');
            
            // Criar link de email
            const subject = encodeURIComponent('Relatório Completo - Dashboard');
            const body = encodeURIComponent(`
Olá,

Segue em anexo o relatório completo do período ${fromDate} a ${toDate}.

Resumo:
${includeIncome ? `- Receita Total: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
${includeExpenses ? `- Despesa Total: ${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
${includeIncome && includeExpenses ? `- Saldo Líquido: ${netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}

Atenciosamente,
Sistema de Dashboard
            `);
            
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
            
            // Abrir cliente de email
            window.open(mailtoLink);
            
            // Simular anexo (em um ambiente real, você enviaria via API)
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = `relatorio_completo_${user.displayName?.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
                link.click();
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            alert('Erro ao enviar relatório. Tente novamente.');
        }
    };

    const sendViaWhatsApp = () => {
        try {
            // Gerar PDF temporário
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

            // Converter para blob
            const pdfBlob = doc.output('blob');
            
            // Criar link do WhatsApp
            const message = encodeURIComponent(`
📊 *Relatório Completo - Dashboard*

Período: ${fromDate} a ${toDate}

💰 *Resumo:*
${includeIncome ? `• Receita Total: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
${includeExpenses ? `• Despesa Total: ${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
${includeIncome && includeExpenses ? `• Saldo Líquido: ${netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}

📄 O relatório completo em PDF será enviado em seguida.
            `);
            
            const whatsappLink = `https://wa.me/?text=${message}`;
            
            // Abrir WhatsApp
            window.open(whatsappLink, '_blank');
            
            // Fazer download do PDF automaticamente
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = `relatorio_completo_${user.displayName?.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
                link.click();
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao enviar via WhatsApp:', error);
            alert('Erro ao enviar via WhatsApp. Tente novamente.');
        }
    };

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
        <div className="space-y-8">
            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Download className="h-10 w-10 text-white" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Relatórios Financeiros</h1>
                    <p className="text-blue-100 text-lg">
                        Análise detalhada dos seus dados financeiros e jornadas de trabalho
                    </p>
                </div>
            </div>

            {/* Controles de filtro e exportação */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Período do Relatório
                        </h3>
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center w-full lg:w-auto">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Exportar
                        </h3>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={exportPDF}
                            className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={exportToExcel}
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={sendReport}
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={sendViaWhatsApp} 
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
            {/* Filtros de conteúdo */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Conteúdo do Relatório
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <Checkbox 
                            id="includeIncome" 
                            checked={includeIncome} 
                            onCheckedChange={(c) => setIncludeIncome(c as boolean)}
                            className="border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor="includeIncome" className="text-green-800 font-medium">Receitas</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl border border-red-200">
                        <Checkbox 
                            id="includeExpenses" 
                            checked={includeExpenses} 
                            onCheckedChange={(c) => setIncludeExpenses(c as boolean)}
                            className="border-red-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <Label htmlFor="includeExpenses" className="text-red-800 font-medium">Despesas</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <Checkbox 
                            id="includeShifts" 
                            checked={includeShifts} 
                            onCheckedChange={(c) => setIncludeShifts(c as boolean)}
                            className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor="includeShifts" className="text-blue-800 font-medium">Jornadas</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <Checkbox 
                            id="includePaidDeliveries" 
                            checked={includePaidDeliveries} 
                            onCheckedChange={(c) => setIncludePaidDeliveries(c as boolean)}
                            className="border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor="includePaidDeliveries" className="text-green-800 font-medium">Entregas Pagas</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <Checkbox 
                            id="includeUnpaidDeliveries" 
                            checked={includeUnpaidDeliveries} 
                            onCheckedChange={(c) => setIncludeUnpaidDeliveries(c as boolean)}
                            className="border-yellow-300 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                        />
                        <Label htmlFor="includeUnpaidDeliveries" className="text-yellow-800 font-medium">Entregas a Receber</Label>
                    </div>
                </div>
            </div>

            {/* Cards de resumo */}
            { (includeIncome || includeExpenses) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Resumo do Período</h3>
                        <p className="text-gray-600">
                            {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : ''}
                            {dateRange?.to ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                        </p>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-3">
                        { includeIncome && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-green-800">Receita Total</h4>
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 text-xl">💰</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-600">
                                    {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                        
                        { includeExpenses && (
                            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-red-800">Despesa Total</h4>
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-red-600 text-xl">💸</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                        
                        { (includeIncome && includeExpenses) && (
                            <div className={`bg-gradient-to-br ${netBalance >= 0 ? 'from-blue-50 to-indigo-50' : 'from-red-50 to-rose-50'} p-6 rounded-xl border ${netBalance >= 0 ? 'border-blue-200' : 'border-red-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-lg font-semibold ${netBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Saldo Líquido</h4>
                                    <div className={`w-12 h-12 ${netBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                                        <span className={`${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'} text-xl`}>
                                            {netBalance >= 0 ? '📈' : '📉'}
                                        </span>
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tabela de transações */}
            { (includeIncome || includeExpenses) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Detalhes das Transações</h3>
                        <p className="text-gray-600">Lista completa de todas as transações no período selecionado</p>
                    </div>
                    
                    {transactionsToDisplay.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-700">Data</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsToDisplay.map(t => (
                                        <TableRow key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                            <TableCell className="font-medium text-gray-900">
                                                {format(t.date.toDate(), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-gray-700">{t.description}</TableCell>
                                            <TableCell className="text-gray-600">{t.category}</TableCell>
                                            <TableCell>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {t.type === 'receita' ? 'Receita' : 'Despesa'}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold text-lg ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'despesa' && '- '}
                                                {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-gray-400 text-2xl">📊</span>
                            </div>
                            <p className="text-gray-500 text-lg">Nenhuma transação no período selecionado</p>
                            <p className="text-gray-400 text-sm mt-1">Ajuste o período ou os filtros para ver os dados</p>
                        </div>
                    )}
                </div>
            )}

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
