import { useState } from 'react';
import { FileText, Upload, Wand2 } from 'lucide-react';
import TemplateDesigner from './components/TemplateDesigner';
import CsvUploader from './components/CsvUploader';
import CertificateGenerator from './components/CertificateGenerator';
import { Template, CertificateData } from './types';

type Step = 'template' | 'upload' | 'generate';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [template, setTemplate] = useState<Template | null>(null);
  const [csvData, setCsvData] = useState<CertificateData[]>([]);

  const handleTemplateSave = (newTemplate: Template) => {
    setTemplate(newTemplate);
    setCurrentStep('upload');
  };

  const handleDataLoaded = (data: CertificateData[]) => {
    setCsvData(data);
  };

  const handleGenerate = () => {
    if (csvData.length > 0 && template) {
      setCurrentStep('generate');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Certificate Generator</h1>
            </div>

            <div className="flex items-center gap-8">
              <button
                onClick={() => setCurrentStep('template')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 'template'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Design Template
              </button>
              <button
                onClick={() => template && setCurrentStep('upload')}
                disabled={!template}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 'upload'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : template
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Data
              </button>
              <button
                onClick={() => template && csvData.length > 0 && setCurrentStep('generate')}
                disabled={!template || csvData.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 'generate'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : template && csvData.length > 0
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileText className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-80px)]">
        {currentStep === 'template' && (
          <TemplateDesigner template={template} onSave={handleTemplateSave} />
        )}

        {currentStep === 'upload' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Certificate Data</h2>
              <p className="text-gray-600">
                Upload a CSV file containing the data for your certificates. The column names should match
                the field names you defined in your template.
              </p>
            </div>

            <CsvUploader onDataLoaded={handleDataLoaded} />

            {csvData.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                >
                  Generate {csvData.length} Certificates
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'generate' && template && csvData.length > 0 && (
          <div className="max-w-6xl mx-auto p-6">
            <CertificateGenerator template={template} data={csvData} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
