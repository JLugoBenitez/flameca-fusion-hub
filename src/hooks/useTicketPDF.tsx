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
  receivedAmount?: number;
}

export function useTicketPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useAppSettings();

  const generateTicket = async (ticketData: TicketData, options?: { preview?: boolean }) => {
    setIsGenerating(true);
    
    try {
      const doc = await createTicketPDF(ticketData);
      
      if (options?.preview) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        toast.success("Ticket generado. Revisa la ventana emergente.");
      } else {
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

  const createTicketPDF = async (ticketData: TicketData): Promise<jsPDF> => {
    const ticketWidth = 80; 
    
    // Función interna para dibujar el contenido y medir la altura real
    const drawContent = async (pdfDoc: jsPDF) => {
      const centerX = ticketWidth / 2;
      let y = 10;

      // --- LOGO ---
      try {
        const logoImg = "/logo.png";
        const img = new Image();
        img.src = logoImg;
        await new Promise((resolve) => {
          img.onload = () => {
            const logoWidth = 25;
            const logoHeight = (img.height * logoWidth) / img.width;
            pdfDoc.addImage(img, 'PNG', centerX - (logoWidth / 2), y, logoWidth, logoHeight);
            y += logoHeight + 2;
            resolve(null);
          };
          img.onerror = () => {
            pdfDoc.setFont('courier', 'bold');
            pdfDoc.setFontSize(22);
            pdfDoc.text('L B F', centerX, y, { align: 'center' });
            y += 8;
            resolve(null);
          };
        });
      } catch (e) {
        y += 5;
      }
      
      // --- ENCABEZADO FISCAL ---
      pdfDoc.setFont('courier', 'normal');
      const separator = "******************************************";
      pdfDoc.setFontSize(7);
      pdfDoc.text(separator, centerX, y, { align: 'center' });
      y += 4;
      
      pdfDoc.text(settings.storeName?.toUpperCase() || 'LA BOUTIQUE FLAMENCA', 5, y); y += 4;
      pdfDoc.text(settings.fiscalAddress?.toUpperCase() || 'CALLE GUADALBULLON LOCAL 7', 5, y); y += 4;
      pdfDoc.text(`${settings.postalCode || '41013'} ${settings.city?.toUpperCase() || 'SEVILLA'}    Tlf: ${settings.storePhone || '633221324'}`, 5, y); y += 4;
      pdfDoc.text(`NIF: ${settings.nif || 'B44793404'}`, 5, y); y += 4;
      
      pdfDoc.text(separator, centerX, y, { align: 'center' });
      y += 4;
      
      // Info de venta (SIN CLIENTE NI DEPENDIENTE)
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES');
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      pdfDoc.text(`N. Fac. Simplificada: ${ticketData.ticketNumber || 'FS24 - 8'}`, 5, y); y += 4;
      pdfDoc.text(`Fecha: ${dateStr}   Hora: ${timeStr}`, 5, y); y += 6;
      
      // --- TABLA DE PRODUCTOS ---
      pdfDoc.text('------------------------------------------', centerX, y, { align: 'center' });
      y += 3;
      pdfDoc.text('Ct. Descripcion          Precio Importe', 5, y);
      y += 3;
      pdfDoc.text('------------------------------------------', centerX, y, { align: 'center' });
      y += 5;
      
      ticketData.items.forEach((item: any) => {
        const name = (item.name || item.product_name || 'ARTICULO').substring(0, 18).toUpperCase();
        const unitPrice = parseFloat(item.price || item.unit_price || 0);
        const quantity = item.quantity || 1;
        const subtotalItem = unitPrice * quantity;

        const qtyStr = quantity.toFixed(2).replace('.', ',');
        const priceStr = unitPrice.toFixed(2).replace('.', ',');
        const totalItemStr = subtotalItem.toFixed(2).replace('.', ',');
        
        pdfDoc.text(`${qtyStr} ${name}`, 5, y);
        pdfDoc.text(priceStr, 55, y, { align: 'right' });
        pdfDoc.text(totalItemStr, 75, y, { align: 'right' });
        y += 5;
      });
      
      y += 2;
      pdfDoc.setFont('courier', 'bold');
      pdfDoc.text(`TOTAL:   ${ticketData.total.toFixed(2).replace('.', ',')}`, 75, y, { align: 'right' });
      y += 8;
      
      // --- PAGOS ---
      pdfDoc.setFont('courier', 'normal');
      const entrega = ticketData.receivedAmount || ticketData.total;
      const cambio = (entrega - ticketData.total) > 0 ? (entrega - ticketData.total) : 0;
      
      pdfDoc.text(`Entrega:     ${entrega.toFixed(2).replace('.', ',')}`, 55, y, { align: 'right' }); y += 4;
      pdfDoc.text(`Devolucion:      ${cambio.toFixed(2).replace('.', ',')}`, 55, y, { align: 'right' }); y += 4;
      pdfDoc.text(`Forma de pago: ${ticketData.paymentMethod.toUpperCase()}`, 5, y); y += 8;
      
      // --- DESGLOSE IVA ---
      const base = (ticketData.total / 1.21);
      const ivaValue = ticketData.total - base;
      
      pdfDoc.text('   BASE    %IVA  IVA', 5, y); y += 4;
      pdfDoc.text(`${base.toFixed(2).padStart(8).replace('.', ',')}    21  ${ivaValue.toFixed(2).replace('.', ',')}`, 5, y); y += 8;
      
      pdfDoc.setFontSize(8);
      pdfDoc.text('IVA INCLUIDO', centerX, y, { align: 'center' }); y += 5;
      pdfDoc.text('GRACIAS POR SU COMPRA.', centerX, y, { align: 'center' }); y += 8;
      
      // --- POLÍTICA DE DEVOLUCIONES ---
      pdfDoc.setFontSize(6.5);
      const policy = [
        "NO SE ADMITE DEVOLUCIONES.",
        "ESTE TICKET ES NECESARIO PARA",
        "CAMBIOS EN UN PLAZO DE 7 DIAS.",
        "LOS ARTICULOS DEBERAN ESTAR EN",
        "PERFECTO ESTADO CON TODOS SUS",
        "ACCESORIOS Y DENTRO DE SU EMBALAJE",
        "ORIGINAL."
      ];
      
      policy.forEach(line => {
        pdfDoc.text(line, 5, y);
        y += 3.5;
      });

      return y + 5; // Retornamos altura final real
    };

    // Paso 1: Medir contenido
    const tempDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ticketWidth, 300] });
    const finalHeight = await drawContent(tempDoc);
    
    // Paso 2: Crear PDF con altura exacta
    const finalDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ticketWidth, finalHeight] });
    await drawContent(finalDoc);
    
    return finalDoc;
  };

  const printTicket = async (ticketData: TicketData) => {
    setIsGenerating(true);
    try {
      const doc = await createTicketPDF(ticketData);
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
        toast.error("No se pudo abrir la ventana de impresión.");
      }
    } catch (error: any) {
      toast.error("Error al imprimir ticket: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateTicket, printTicket, isGenerating };
}