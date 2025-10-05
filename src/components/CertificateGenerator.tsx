import React, { useState, useRef } from 'react';
import { Download, FileImage, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { Template, CertificateData } from '../types';

interface CertificateGeneratorProps {
  template: Template;
  data: CertificateData[];
}

export default function CertificateGenerator({ template, data }: CertificateGeneratorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const certificateRef = useRef<HTMLDivElement>(null);

  const renderCertificate = (certificateData: CertificateData) => {
    return (
      <div
        ref={certificateRef}
        className="relative mx-auto shadow-2xl origin-top-left"
        style={{
          width: template.width,
          height: template.height,
          transform: `scale(${zoom})`
        }}
      >
        <img
          src={template.backgroundUrl}
          alt="Certificate"
          className="absolute inset-0 w-full h-full"
        />
        {template.fields.map((field) => (
          <div
            key={field.id}
            className="absolute"
            style={{
              left: field.x,
              top: field.y,
              fontSize: field.fontSize,
              fontFamily: field.fontFamily,
              color: field.color,
              textAlign: field.align
            }}
          >
            {certificateData[field.fieldName] || `{${field.fieldName}}`}
          </div>
        ))}
      </div>
    );
  };

  const captureCanvas = async (index: number): Promise<HTMLCanvasElement> => {
    setCurrentIndex(index);
    await new Promise(resolve => setTimeout(resolve, 100));

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${template.width}px`;
    tempDiv.style.height = `${template.height}px`;
    document.body.appendChild(tempDiv);

    const tempCertificate = document.createElement('div');
    tempCertificate.style.position = 'relative';
    tempCertificate.style.width = `${template.width}px`;
    tempCertificate.style.height = `${template.height}px`;

    const img = document.createElement('img');
    img.src = template.backgroundUrl;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    tempCertificate.appendChild(img);

    template.fields.forEach((field) => {
      const textDiv = document.createElement('div');
      textDiv.style.position = 'absolute';
      textDiv.style.left = `${field.x}px`;
      textDiv.style.top = `${field.y}px`;
      textDiv.style.fontSize = `${field.fontSize}px`;
      textDiv.style.fontFamily = field.fontFamily;
      textDiv.style.color = field.color;
      textDiv.style.textAlign = field.align;
      textDiv.textContent = data[index][field.fieldName] || `{${field.fieldName}}`;
      tempCertificate.appendChild(textDiv);
    });

    tempDiv.appendChild(tempCertificate);

    const canvas = await html2canvas(tempCertificate, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(tempDiv);
    return canvas;
  };

  const generatePdf = async (index: number) => {
    const canvas = await captureCanvas(index);
    const imgData = canvas.toDataURL('image/jpeg', 0.8);

    const pdf = new jsPDF({
      orientation: template.width > template.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [template.width, template.height],
      compress: true
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, template.width, template.height, undefined, 'MEDIUM');
    pdf.save(`certificate_${data[index].name || index + 1}.pdf`);
  };

  const generateJpg = async (index: number) => {
    const canvas = await captureCanvas(index);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${data[index].name || index + 1}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.85);
  };

  const generateAllPdf = async () => {
    setIsGenerating(true);

    const pdf = new jsPDF({
      orientation: template.width > template.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [template.width, template.height],
      compress: true
    });

    for (let i = 0; i < data.length; i++) {
      const canvas = await captureCanvas(i);
      const imgData = canvas.toDataURL('image/jpeg', 0.8);

      if (i > 0) {
        pdf.addPage([template.width, template.height]);
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, template.width, template.height, undefined, 'MEDIUM');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    pdf.save('certificates_all.pdf');
    setIsGenerating(false);
    setCurrentIndex(0);
  };

  const generateAllJpg = async () => {
    setIsGenerating(true);

    const zip = new JSZip();
    const folder = zip.folder('certificates');

    for (let i = 0; i < data.length; i++) {
      const canvas = await captureCanvas(i);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
        }, 'image/jpeg', 0.85);
      });

      const fileName = `certificate_${data[i].name || i + 1}.jpg`.replace(/[^a-z0-9_\-\.]/gi, '_');
      folder?.file(fileName, blob);

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificates_all.zip';
    a.click();
    URL.revokeObjectURL(url);

    setIsGenerating(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Certificate Preview ({currentIndex + 1} of {data.length})
          </h3>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-16 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => generatePdf(currentIndex)}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => generateJpg(currentIndex)}
              disabled={isGenerating}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileImage className="w-4 h-4" />
              Export JPG
            </button>
          </div>
        </div>

        <div className="bg-gray-100 p-8 rounded-lg overflow-auto">
          {renderCertificate(data[currentIndex])}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0 || isGenerating}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex(Math.min(data.length - 1, currentIndex + 1))}
            disabled={currentIndex === data.length - 1 || isGenerating}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Bulk Export</h4>
        <p className="text-gray-600 mb-4">
          Generate all {data.length} certificates at once. PDF creates a single multi-page file, JPG creates a ZIP archive.
        </p>

        <div className="flex gap-3">
          <button
            onClick={generateAllPdf}
            disabled={isGenerating}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Export All as Multi-page PDF'}
          </button>
          <button
            onClick={generateAllJpg}
            disabled={isGenerating}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Export All as ZIP'}
          </button>
        </div>

        {isGenerating && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentIndex + 1} / {data.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
