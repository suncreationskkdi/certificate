import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';
import { CertificateData } from '../types';

interface CsvUploaderProps {
  onDataLoaded: (data: CertificateData[]) => void;
}

export default function CsvUploader({ onDataLoaded }: CsvUploaderProps) {
  const [csvData, setCsvData] = useState<CertificateData[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const data = results.data as CertificateData[];
          setCsvData(data);
          onDataLoaded(data);
        } else {
          setError('No data found in CSV file');
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      { name: 'John Doe', designation: 'Software Engineer', college: 'MIT', date: '2024-01-15' },
      { name: 'Jane Smith', designation: 'Data Scientist', college: 'Stanford', date: '2024-01-15' },
      { name: 'Mike Johnson', designation: 'Product Manager', college: 'Harvard', date: '2024-01-15' }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-certificate-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload CSV Data</h3>

        <label className="block">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-1">Click to upload CSV file</p>
            <p className="text-sm text-gray-400">or drag and drop</p>
          </div>
        </label>

        <button
          onClick={downloadSampleCsv}
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
        >
          Download Sample CSV
        </button>

        {fileName && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">{fileName}</span>
            <span className="text-gray-500">({csvData.length} records)</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {csvData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Preview</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-4 py-3 text-sm text-gray-700">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing 5 of {csvData.length} records
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
