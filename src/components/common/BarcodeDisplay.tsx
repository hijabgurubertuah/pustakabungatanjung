import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'QR';
  height?: number;
  width?: number;
  displayValue?: boolean;
  className?: string;
}

export const BarcodeDisplay: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  height = 40,
  width = 1.5,
  displayValue = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!value) return;

    if (format === 'QR') {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, value, {
          width: height * 2,
          margin: 1,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        }).catch((err) => console.error(err));
      }
    } else {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            height,
            width,
            displayValue,
            fontSize: 11,
            textMargin: 2,
            margin: 4,
            lineColor: '#1e293b',
          });
        } catch {
          // Fallback if specific chars fail standard format
          try {
            JsBarcode(svgRef.current, value, {
              format: 'CODE39',
              height,
              width: 1.2,
              displayValue,
              fontSize: 10,
              margin: 4,
              lineColor: '#1e293b',
            });
          } catch (e) {
            console.warn('Barcode render fallback error:', e);
          }
        }
      }
    }
  }, [value, format, height, width, displayValue]);

  if (format === 'QR') {
    return <canvas ref={canvasRef} className={`inline-block ${className}`} />;
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
