import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  users?: any[];
  deliveries?: any[];
  financial?: any;
  stats?: any;
}

export interface PDFExportOptions {
  title: string;
  filename: string;
  data: any[];
  columns: Array<{
    header: string;
    dataKey: string;
    width?: number;
  }>;
}

export interface ExcelExportOptions {
  filename: string;
  sheets: Array<{
    name: string;
    data: any[];
    columns: string[];
  }>;
}

/**
 * Exporta dados para PDF
 */
export const exportToPDF = (options: PDFExportOptions): void => {
  try {
    const doc = new jsPDF();
    
    // Título do documento
    doc.setFontSize(20);
    doc.text(options.title, 14, 22);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela de dados
    doc.autoTable({
      startY: 35,
      head: [options.columns.map(col => col.header)],
      body: options.data.map(row => 
        options.columns.map(col => {
          const value = row[col.dataKey];
          if (value instanceof Date) {
            return value.toLocaleDateString('pt-BR');
          }
          if (typeof value === 'number' && col.dataKey.includes('amount')) {
            return `R$ ${value.toFixed(2)}`;
          }
          return value?.toString() || '';
        })
      ),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      columnStyles: options.columns.reduce((acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      }, {} as any),
    });
    
    // Salvar o arquivo
    doc.save(`${options.filename}.pdf`);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Não foi possível gerar o PDF');
  }
};

/**
 * Exporta dados para Excel
 */
export const exportToExcel = (options: ExcelExportOptions): void => {
  try {
    const workbook = XLSX.utils.book_new();
    
    options.sheets.forEach(sheet => {
      // Preparar dados para o Excel
      const worksheetData = [
        sheet.columns, // Cabeçalhos
        ...sheet.data.map(row => 
          sheet.columns.map(column => {
            const value = row[column];
            if (value instanceof Date) {
              return value.toLocaleDateString('pt-BR');
            }
            if (typeof value === 'number' && column.includes('amount')) {
              return value;
            }
            return value?.toString() || '';
          })
        )
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Estilizar cabeçalhos
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center" }
        };
      }
      
      // Ajustar largura das colunas
      const colWidths = sheet.columns.map(() => ({ wch: 15 }));
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
    
    // Salvar o arquivo
    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    throw new Error('Não foi possível gerar o Excel');
  }
};

/**
 * Exporta relatório de usuários para PDF
 */
export const exportUsersToPDF = (users: any[]): void => {
  const options: PDFExportOptions = {
    title: 'Relatório de Usuários - Co-Piloto Driver',
    filename: `usuarios_${new Date().toISOString().split('T')[0]}`,
    data: users,
    columns: [
      { header: 'Nome', dataKey: 'displayName', width: 30 },
      { header: 'Email', dataKey: 'email', width: 40 },
      { header: 'Tipo', dataKey: 'userType', width: 15 },
      { header: 'Status', dataKey: 'isActive', width: 15 },
      { header: 'Entregas', dataKey: 'totalDeliveries', width: 15 },
      { header: 'Receita', dataKey: 'totalRevenue', width: 20 },
    ]
  };
  
  exportToPDF(options);
};

/**
 * Exporta relatório de usuários para Excel
 */
export const exportUsersToExcel = (users: any[]): void => {
  const options: ExcelExportOptions = {
    filename: `usuarios_${new Date().toISOString().split('T')[0]}`,
    sheets: [
      {
        name: 'Usuários',
        data: users,
        columns: ['displayName', 'email', 'userType', 'isActive', 'totalDeliveries', 'totalRevenue']
      }
    ]
  };
  
  exportToExcel(options);
};

/**
 * Exporta relatório de entregas para PDF
 */
export const exportDeliveriesToPDF = (deliveries: any[]): void => {
  const options: PDFExportOptions = {
    title: 'Relatório de Entregas - Co-Piloto Driver',
    filename: `entregas_${new Date().toISOString().split('T')[0]}`,
    data: deliveries,
    columns: [
      { header: 'Descrição', dataKey: 'description', width: 40 },
      { header: 'Valor', dataKey: 'amount', width: 20 },
      { header: 'Status', dataKey: 'deliveryStatus', width: 20 },
      { header: 'Pagamento', dataKey: 'paymentStatus', width: 20 },
      { header: 'Remetente', dataKey: 'senderCompany', width: 30 },
      { header: 'Destinatário', dataKey: 'recipientCompany', width: 30 },
      { header: 'Data', dataKey: 'date', width: 25 },
    ]
  };
  
  exportToPDF(options);
};

/**
 * Exporta relatório de entregas para Excel
 */
export const exportDeliveriesToExcel = (deliveries: any[]): void => {
  const options: ExcelExportOptions = {
    filename: `entregas_${new Date().toISOString().split('T')[0]}`,
    sheets: [
      {
        name: 'Entregas',
        data: deliveries,
        columns: ['description', 'amount', 'deliveryStatus', 'paymentStatus', 'senderCompany', 'recipientCompany', 'date']
      }
    ]
  };
  
  exportToExcel(options);
};

/**
 * Exporta relatório financeiro completo para PDF
 */
export const exportFinancialToPDF = (data: {
  users: any[];
  deliveries: any[];
  financial: any;
}): void => {
  const doc = new jsPDF();
  
  // Título principal
  doc.setFontSize(20);
  doc.text('Relatório Financeiro Completo - Co-Piloto Driver', 14, 22);
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
  
  let currentY = 40;
  
  // Resumo Financeiro
  doc.setFontSize(16);
  doc.text('Resumo Financeiro', 14, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.text(`Receita Total: R$ ${data.financial.totalRevenue?.toFixed(2) || '0.00'}`, 14, currentY);
  currentY += 8;
  doc.text(`Despesas Totais: R$ ${data.financial.totalExpenses?.toFixed(2) || '0.00'}`, 14, currentY);
  currentY += 8;
  doc.text(`Lucro Líquido: R$ ${((data.financial.totalRevenue || 0) - (data.financial.totalExpenses || 0)).toFixed(2)}`, 14, currentY);
  currentY += 15;
  
  // Tabela de Entregas
  if (data.deliveries.length > 0) {
    doc.setFontSize(14);
    doc.text('Entregas', 14, currentY);
    currentY += 10;
    
    doc.autoTable({
      startY: currentY,
      head: [['Descrição', 'Valor', 'Status', 'Data']],
      body: data.deliveries.slice(0, 20).map(delivery => [
        delivery.description || '',
        `R$ ${delivery.amount?.toFixed(2) || '0.00'}`,
        delivery.deliveryStatus || '',
        delivery.date instanceof Date ? delivery.date.toLocaleDateString('pt-BR') : 
        delivery.date?.toDate ? delivery.date.toDate().toLocaleDateString('pt-BR') : ''
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Salvar o arquivo
  doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Exporta relatório financeiro completo para Excel
 */
export const exportFinancialToExcel = (data: {
  users: any[];
  deliveries: any[];
  financial: any;
}): void => {
  const options: ExcelExportOptions = {
    filename: `relatorio_financeiro_${new Date().toISOString().split('T')[0]}`,
    sheets: [
      {
        name: 'Resumo',
        data: [
          { 'Métrica': 'Receita Total', 'Valor': data.financial.totalRevenue || 0 },
          { 'Métrica': 'Despesas Totais', 'Valor': data.financial.totalExpenses || 0 },
          { 'Métrica': 'Lucro Líquido', 'Valor': (data.financial.totalRevenue || 0) - (data.financial.totalExpenses || 0) },
          { 'Métrica': 'Ticket Médio', 'Valor': data.financial.averageDeliveryValue || 0 },
        ],
        columns: ['Métrica', 'Valor']
      },
      {
        name: 'Entregas',
        data: data.deliveries,
        columns: ['description', 'amount', 'deliveryStatus', 'paymentStatus', 'senderCompany', 'recipientCompany', 'date']
      },
      {
        name: 'Usuários',
        data: data.users,
        columns: ['displayName', 'email', 'userType', 'isActive', 'totalDeliveries', 'totalRevenue']
      }
    ]
  };
  
  exportToExcel(options);
};
