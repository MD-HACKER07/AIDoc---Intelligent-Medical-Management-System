import React, { useState } from 'react';
import { MedicalReportUploader } from '../components/MedicalReportUploader';

const MedicalReports: React.FC = () => {
  const [reportData, setReportData] = useState<Record<string, any> | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  const handleReportData = (data: Record<string, any>) => {
    setReportData(data);
  };

  const handleExtractedText = (text: string) => {
    setExtractedText(text);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Medical Reports</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <MedicalReportUploader 
            onReportData={handleReportData}
            onExtractedText={handleExtractedText}
          />
        </div>
      </div>

      {/* You could add additional sections here for report history, etc. */}
    </div>
  );
};

export default MedicalReports; 