import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAppSettings } from './useAppSettings';
import { CartItem } from '@/types';

export interface TicketData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  ticketNumber?: string;
}

export function useTicketPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useAppSettings();

  const generateTicket = async (ticketData: TicketData, options?: { preview?: boolean }) => {
    setIsGenerating(true);
    
    try {
      const doc = createTicketPDF(ticketData);
      
      // Si es preview, abrir en nueva ventana
      if (options?.preview) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        toast.success("Ticket generado. Revisa la ventana emergente.");
      } else {
        // Descargar el PDF
        const ticketNumber = ticketData.ticketNumber || `TICKET-${Date.now()}`;
        doc.save(`ticket-${ticketNumber}.pdf`);
        toast.success("Ticket descargado correctamente");
      }
      
    } catch (error: any) {
      toast.error("Error al generar ticket: " + (error.message || "Error desconocido"));
    } finally {
      setIsGenerating(false);
    }
  };

  const createTicketPDF = (ticketData: TicketData): jsPDF => {
    // Crear PDF con formato estándar A4 y luego ajustar el ancho visualmente
    // El ancho del ticket será de 80mm (226.77pt)
    const ticketWidth = 226.77; // 80mm en puntos
    const marginLeft = (595.28 - ticketWidth) / 2; // Centrar en A4 (ancho A4 = 595.28pt)
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4' // Usar formato estándar
    });
    
    // Establecer márgenes para simular el ancho del ticket
    const startX = marginLeft;
    
    doc.setFont('helvetica');
    let yPos = 20;
    
    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.storeName || 'TIENDA', startX + ticketWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (settings.fiscalAddress) {
      doc.text(settings.fiscalAddress, startX + ticketWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    if (settings.postalCode && settings.city) {
      doc.text(`${settings.postalCode} ${settings.city}`, startX + ticketWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    if (settings.storePhone) {
      doc.text(`Tel: ${settings.storePhone}`, startX + ticketWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    if (settings.storeEmail) {
      doc.text(settings.storeEmail, startX + ticketWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(startX + 10, yPos, startX + ticketWidth - 10, yPos);
    yPos += 10;
    
    // Fecha y hora
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    doc.setFontSize(8);
    doc.text(`Fecha: ${dateStr}`, startX + 15, yPos);
    doc.text(`Hora: ${timeStr}`, startX + ticketWidth - 15, yPos, { align: 'right' });
    yPos += 12;
    
    if (ticketData.ticketNumber) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Ticket #${ticketData.ticketNumber}`, startX + ticketWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    
    doc.line(startX + 10, yPos, startX + ticketWidth - 10, yPos);
    yPos += 10;
    
    // Productos
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS', startX + 15, yPos);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    ticketData.items.forEach((item) => {
      const productName = item.product_name || 'Producto';
      const nameLines = doc.splitTextToSize(productName, ticketWidth - 100);
      nameLines.forEach((line: string, index: number) => {
        doc.text(line, startX + 15, yPos);
        if (index === 0) {
          doc.text(`${item.quantity}x`, startX + ticketWidth - 80, yPos, { align: 'right' });
          doc.text(`${item.subtotal.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
        }
        yPos += 10;
      });
      if (nameLines.length > 1) yPos += 2;
    });
    
    yPos += 5;
    doc.line(startX + 10, yPos, startX + ticketWidth - 10, yPos);
    yPos += 10;
    
    // Totales
    const subtotalSinIVA = ticketData.subtotal / 1.21;
    doc.setFontSize(8);
    doc.text('Subtotal (sin IVA):', startX + 15, yPos);
    doc.text(`${subtotalSinIVA.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    const iva = ticketData.subtotal - subtotalSinIVA;
    doc.text(`IVA (${settings.ivaRate || 21}%):`, startX + 15, yPos);
    doc.text(`${iva.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    doc.text('Subtotal (con IVA):', startX + 15, yPos);
    doc.text(`${ticketData.subtotal.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    if (ticketData.discount > 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('Descuento:', startX + 15, yPos);
      doc.text(`-${ticketData.discount.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
      yPos += 10;
    }
    
    doc.line(startX + 10, yPos, startX + ticketWidth - 10, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', startX + 15, yPos);
    doc.text(`${ticketData.total.toFixed(2)}€`, startX + ticketWidth - 15, yPos, { align: 'right' });
    yPos += 15;
    
    // Método de pago
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Método de pago:', startX + 15, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(ticketData.paymentMethod, startX + 15, yPos);
    yPos += 15;
    
    doc.line(startX + 10, yPos, startX + ticketWidth - 10, yPos);
    yPos += 10;
    
    // Pie de página
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Gracias por su compra', startX + ticketWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    if (settings.storeWebsite) {
      doc.text(settings.storeWebsite, startX + ticketWidth / 2, yPos, { align: 'center' });
    }
    
    return doc;
  };

  const printTicket = async (ticketData: TicketData) => {
    setIsGenerating(true);
    
    try {
      const doc = createTicketPDF(ticketData);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            toast.success("Abriendo diálogo de impresión...");
          }, 250);
        };
      } else {
        toast.error("No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.");
      }
    } catch (error: any) {
      toast.error("Error al imprimir ticket: " + (error.message || "Error desconocido"));
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTicket,
    printTicket,
    isGenerating
  };
}
