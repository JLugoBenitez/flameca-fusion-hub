import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { useAppSettings } from './useAppSettings';
import { Product, Variation } from '@/types';

export interface LabelData {
  product: Product;
  variation?: Variation;
  barcode: string;
}

export function useProductLabel() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useAppSettings();

  // Dimensiones estándar mundial (mm)
  const LABEL_WIDTH = 50;
  const LABEL_HEIGHT = 30;

  /**
   * Genera una única etiqueta
   */
  const generateLabel = async (labelData: LabelData, options?: { preview?: boolean }) => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [LABEL_WIDTH, LABEL_HEIGHT],
      });

      await addLabelToPDF(doc, labelData, 0, 0);

      if (options?.preview) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      } else {
        const fileName = `etiqueta-${labelData.barcode}.pdf`;
        doc.save(fileName);
      }
      // Toast eliminado - la etiqueta se genera correctamente sin notificación
    } catch (error: any) {
      toast.error("Error: " + (error.message || "Error desconocido"));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera múltiples etiquetas (una por página en el PDF)
   */
  const generateMultipleLabels = async (labelsData: LabelData[], options?: { preview?: boolean }) => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [LABEL_WIDTH, LABEL_HEIGHT],
      });

      for (let i = 0; i < labelsData.length; i++) {
        if (i > 0) {
          doc.addPage([LABEL_WIDTH, LABEL_HEIGHT], 'landscape');
        }
        await addLabelToPDF(doc, labelsData[i], 0, 0);
      }

      if (options?.preview) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      } else {
        doc.save(`etiquetas-${Date.now()}.pdf`);
      }
      // Toast eliminado - las etiquetas se generan correctamente sin notificación
    } catch (error: any) {
      toast.error("Error al generar: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Dibuja el contenido dentro del lienzo de la etiqueta
   */
  const addLabelToPDF = async (doc: jsPDF, labelData: LabelData, x: number, y: number) => {
    const margin = 2.5;
    const centerX = x + (LABEL_WIDTH / 2);
    let currentY = y + margin;

    // 1. Nombre de la Tienda
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text(settings.storeName?.toUpperCase() || 'LA BOUTIQUE FLAMENCA', centerX, currentY, { align: 'center' });
    currentY += 4;

    // 2. Nombre del Producto (Máximo 2 líneas)
    doc.setFontSize(7);
    const productName = (labelData.product.name).toUpperCase();
    const splitName = doc.splitTextToSize(productName, LABEL_WIDTH - (margin * 2));
    doc.text(splitName.slice(0, 2), centerX, currentY, { align: 'center' });
    currentY += (splitName.length > 1 ? 7 : 4);

    // 3. Referencia y Atributos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    const sku = labelData.variation?.sku || labelData.product.sku || 'N/A';
    const size = getSizeFromVariation(labelData.variation);
    const attrs = labelData.variation ? getVariationAttributes(labelData.variation) : '';
    
    const infoText = size ? `REF: ${sku} | TALLA: ${size}` : `REF: ${sku} ${attrs}`;
    doc.text(infoText, centerX, currentY, { align: 'center' });
    currentY += 1.5;

    // 4. Precio (IVA incluido)
    const price = labelData.variation 
      ? parseFloat(labelData.variation.price || labelData.variation.regular_price || '0')
      : typeof labelData.product.price === 'string' 
        ? parseFloat(labelData.product.price) 
        : labelData.product.price;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(price * 1.21).toFixed(2)}€`, centerX, currentY + 4, { align: 'center' });
    currentY += 5;

    // 5. Código de Barras (JsBarcode)
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, labelData.barcode, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 20,
        margin: 0,
        background: "#ffffff"
      });
      const imgData = canvas.toDataURL('image/png');
      // Ajuste de posición para que el código de barras no se salga
      doc.addImage(imgData, 'PNG', x + 5, currentY, LABEL_WIDTH - 10, 9);
    } catch (e) {
      doc.setFontSize(6);
      doc.text(labelData.barcode, centerX, currentY + 4, { align: 'center' });
    }
  };

  // --- FUNCIONES AUXILIARES ---

  const getVariationAttributes = (variation: Variation): string => {
    if (!variation.attributes || variation.attributes.length === 0) return '';
    return variation.attributes.map(attr => attr.option).join(' ');
  };

  const getSizeFromVariation = (variation: Variation | undefined): string | null => {
    if (!variation || !variation.attributes) return null;
    const sizeAttr = variation.attributes.find(attr => 
      attr.name.toLowerCase().includes('talla') || 
      attr.name.toLowerCase().includes('size')
    );
    return sizeAttr ? sizeAttr.option : null;
  };

  return {
    generateLabel,
    generateMultipleLabels,
    isGenerating
  };
}