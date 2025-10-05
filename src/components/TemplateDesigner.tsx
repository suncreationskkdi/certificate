import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { Template, TemplateField } from '../types';

interface TemplateDesignerProps {
  template: Template | null;
  onSave: (template: Template) => void;
}

export default function TemplateDesigner({ template, onSave }: TemplateDesignerProps) {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(template);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newTemplate: Template = {
            id: currentTemplate?.id || Date.now().toString(),
            name: currentTemplate?.name || 'New Template',
            backgroundUrl: event.target?.result as string,
            width: img.width,
            height: img.height,
            fields: currentTemplate?.fields || []
          };
          setCurrentTemplate(newTemplate);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = () => {
    if (!currentTemplate) return;

    const newField: TemplateField = {
      id: Date.now().toString(),
      fieldName: `field_${currentTemplate.fields.length + 1}`,
      x: 100,
      y: 100,
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center'
    };

    setCurrentTemplate({
      ...currentTemplate,
      fields: [...currentTemplate.fields, newField]
    });
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    if (!currentTemplate) return;

    setCurrentTemplate({
      ...currentTemplate,
      fields: currentTemplate.fields.map(f =>
        f.id === id ? { ...f, ...updates } : f
      )
    });
  };

  const deleteField = (id: string) => {
    if (!currentTemplate) return;

    setCurrentTemplate({
      ...currentTemplate,
      fields: currentTemplate.fields.filter(f => f.id !== id)
    });
    setSelectedField(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    const field = currentTemplate?.fields.find(f => f.id === fieldId);
    if (!field) return;

    setSelectedField(fieldId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - field.x,
      y: e.clientY - field.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x + rect.left;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y + rect.top;

    updateField(selectedField, { x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (currentTemplate) {
      onSave(currentTemplate);
    }
  };

  if (!currentTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Template</h2>
          <p className="text-gray-600 mb-6">Upload a background image to start designing your certificate template.</p>
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <Plus className="w-12 h-12 mx-auto mb-2 text-blue-500" />
              <span className="text-blue-600 font-medium">Choose Background Image</span>
            </div>
          </label>
        </div>
      </div>
    );
  }

  const selectedFieldData = currentTemplate.fields.find(f => f.id === selectedField);

  return (
    <div className="flex h-full">
      <div className="flex-1 bg-gray-100 p-6 overflow-auto">
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            value={currentTemplate.name}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
            className="text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1"
          />
          <div className="flex items-center gap-3">
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
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative bg-white shadow-2xl mx-auto origin-top-left"
          style={{
            width: currentTemplate.width,
            height: currentTemplate.height,
            transform: `scale(${zoom})`
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={currentTemplate.backgroundUrl}
            alt="Certificate background"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {currentTemplate.fields.map((field) => (
            <div
              key={field.id}
              className={`absolute cursor-move border-2 ${
                selectedField === field.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-blue-300'
              } px-2 py-1 transition-all`}
              style={{
                left: field.x,
                top: field.y,
                fontSize: field.fontSize,
                fontFamily: field.fontFamily,
                color: field.color,
                textAlign: field.align
              }}
              onMouseDown={(e) => handleMouseDown(e, field.id)}
            >
              {`{${field.fieldName}}`}
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
        <div className="mb-6">
          <button
            onClick={addField}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Field
          </button>
        </div>

        {selectedFieldData ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Field Properties</h3>
              <button
                onClick={() => deleteField(selectedFieldData.id)}
                className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={selectedFieldData.fieldName}
                onChange={(e) => updateField(selectedFieldData.id, { fieldName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                <input
                  type="number"
                  value={selectedFieldData.x}
                  onChange={(e) => updateField(selectedFieldData.id, { x: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                <input
                  type="number"
                  value={selectedFieldData.y}
                  onChange={(e) => updateField(selectedFieldData.id, { y: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <input
                type="number"
                value={selectedFieldData.fontSize}
                onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select
                value={selectedFieldData.fontFamily}
                onChange={(e) => updateField(selectedFieldData.id, { fontFamily: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: selectedFieldData.fontFamily }}
              >
                <optgroup label="System Fonts">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </optgroup>
                <optgroup label="Google Fonts - Serif">
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Cinzel">Cinzel</option>
                  <option value="Cormorant">Cormorant</option>
                  <option value="Crimson Text">Crimson Text</option>
                  <option value="Libre Baskerville">Libre Baskerville</option>
                </optgroup>
                <optgroup label="Google Fonts - Sans Serif">
                  <option value="Montserrat">Montserrat</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Oswald">Oswald</option>
                </optgroup>
                <optgroup label="Google Fonts - Display">
                  <option value="Abril Fatface">Abril Fatface</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                </optgroup>
                <optgroup label="Google Fonts - Script">
                  <option value="Dancing Script">Dancing Script</option>
                  <option value="Great Vibes">Great Vibes</option>
                  <option value="Pacifico">Pacifico</option>
                  <option value="Satisfy">Satisfy</option>
                  <option value="Tangerine">Tangerine</option>
                </optgroup>
                <optgroup label="Google Fonts - Tamil">
                  <option value="Hind Madurai">Hind Madurai</option>
                  <option value="Mukta Malar">Mukta Malar</option>
                  <option value="Catamaran">Catamaran</option>
                  <option value="Pavanam">Pavanam</option>
                  <option value="Baloo Thambi 2">Baloo Thambi 2</option>
                  <option value="Karla">Karla</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={selectedFieldData.color}
                onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alignment</label>
              <select
                value={selectedFieldData.align}
                onChange={(e) => updateField(selectedFieldData.id, { align: e.target.value as 'left' | 'center' | 'right' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <p>Click on a field to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}
