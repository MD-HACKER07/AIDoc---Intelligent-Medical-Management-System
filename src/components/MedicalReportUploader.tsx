import React, { useState, useRef } from 'react';
import { 
  processFile, 
  validateFile, 
  parseToMedicalReport,
  FileProcessingError,
  FileProcessingErrorType,
  getFileTypeName
} from '../utils/fileProcessing';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';

interface MedicalReportUploaderProps {
  onReportData?: (data: Record<string, any>) => void;
  onExtractedText?: (text: string) => void;
  className?: string;
}

export const MedicalReportUploader: React.FC<MedicalReportUploaderProps> = ({
  onReportData,
  onExtractedText,
  className = ''
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedData, setParsedData] = useState<Record<string, any> | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { hospital } = useHospital();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Record<string, any>>({
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      mrn: '',
      dateOfService: ''
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setExtractedText('');
    setParsedData(null);
    
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setFile(selectedFile);
      }
    } else {
      setFile(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText('');
    setParsedData(null);

    try {
      const text = await processFile(file);
      setExtractedText(text);
      
      if (onExtractedText) {
        onExtractedText(text);
      }

      const reportData = parseToMedicalReport(text);
      setParsedData(reportData);
      
      if (onReportData) {
        onReportData(reportData);
      }

      const hasEmptyValues = Object.values(reportData).some(section => 
        typeof section === 'object' && 
        Object.values(section).every(value => !value)
      );
      
      if (hasEmptyValues) {
        setError('Limited data could be automatically extracted. Consider using manual entry for better results.');
      }
    } catch (err) {
      if (err instanceof FileProcessingError) {
        switch (err.type) {
          case FileProcessingErrorType.FILE_NOT_FOUND:
            setError('File not found. Please select a file and try again.');
            break;
          case FileProcessingErrorType.INVALID_FILE_TYPE:
            setError('Invalid file type. Please upload a supported file format (PDF, TXT, or image).');
            break;
          case FileProcessingErrorType.PARSE_ERROR:
            if (err.message.includes('scanned or image-based')) {
              setError(`${err.message} Try using a text-based PDF or use manual entry instead.`);
            } else if (err.message.includes('password-protected')) {
              setError('The PDF appears to be password-protected. Please remove the password protection and try again.');
            } else {
              setError(`Could not parse the file: ${err.message}`);
            }
            setShowManualEntry(true);
            break;
          case FileProcessingErrorType.UNSUPPORTED_FILE:
            setError(err.message);
            break;
          default:
            setError(`An error occurred: ${err.message}`);
        }
      } else {
        setError('Failed to process the file. Please try again or use manual entry.');
        console.error('Medical report processing error:', err);
        setShowManualEntry(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validation = validateFile(droppedFile);
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
      } else {
        setFile(droppedFile);
        if (fileInputRef.current) {
          fileInputRef.current.files = e.dataTransfer.files;
        }
      }
    }
  };

  const promptFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const downloadTemplate = () => {
    const templateText = `# Medical Report Template

## Patient Information
- Name: [Patient Name]
- Age: [Age]
- Gender: [Gender]
- Medical Record Number: [MRN]
- Date of Service: [Date]

## Clinical Information
- Chief Complaint: [Primary reason for visit]
- History of Present Illness: [Detailed description]
- Past Medical History: [Relevant medical conditions]
- Medications: [Current medications]
- Allergies: [Known allergies]

## Physical Examination
- Vital Signs: [BP, HR, RR, Temp, O2 Sat]
- General Appearance: [Description]
- Examination Findings: [By system]

## Diagnostic Results
- Laboratory Tests: [Test results]
- Imaging Studies: [Findings]
- Other Tests: [Additional diagnostic information]

## Assessment
- Diagnosis/Impressions: [List diagnoses]
- Clinical Reasoning: [Explanation]

## Plan
- Treatment Recommendations: [Detailed plan]
- Medications Prescribed: [New/changed medications]
- Follow-up Instructions: [Timeline and requirements]
- Referrals: [If applicable]

## Additional Notes
[Any other relevant information]`;

    const blob = new Blob([templateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_report_template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFormChange = (
    section: string,
    field: string,
    value: string
  ) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value
      }
    }));
  };

  const handleSaveReport = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    
    if (!user || !hospital) {
      setSaveError('You must be logged in to save reports');
      return;
    }
    
    const patientInfo = parsedData?.patientInfo || formData.patientInfo;
    if (!patientInfo.name) {
      setSaveError('Patient name is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const reportData = {
        patientInfo: parsedData?.patientInfo || formData.patientInfo,
        clinicalInfo: parsedData?.clinicalInfo || formData.clinicalInfo || {},
        physicalExam: parsedData?.physicalExam || formData.physicalExam || {},
        diagnosticResults: parsedData?.diagnosticResults || formData.diagnosticResults || {},
        assessment: parsedData?.assessment || formData.assessment || {},
        plan: parsedData?.plan || formData.plan || {},
        additionalNotes: parsedData?.additionalNotes || formData.additionalNotes || '',
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        userId: user.uid,
        reportType: file ? getFileTypeName(file.type) : 'Manual Entry',
        originalFilename: file ? file.name : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const reportsCollection = collection(db, 'medicalReports');
      const docRef = await addDoc(reportsCollection, reportData);
      
      console.log('Report saved with ID:', docRef.id);
      setSaveSuccess(true);
      
      if (showManualEntry && !file) {
        setFormData({
          patientInfo: {
            name: '',
            age: '',
            gender: '',
            mrn: '',
            dateOfService: ''
          }
        });
      }
      
    } catch (err) {
      console.error('Error saving report:', err);
      setSaveError('Failed to save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`medical-report-uploader ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Medical Report Processor</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer
          ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'}
          transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={promptFileSelection}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.tiff"
          ref={fileInputRef}
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="mb-1 text-sm text-gray-600">Selected File: <span className="font-medium">{file.name}</span></p>
            <p className="text-xs text-gray-500">Type: {getFileTypeName(file.type)} | Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <p className="mb-1 text-sm text-gray-500">Drag and drop file here, or click to select</p>
            <p className="text-xs text-gray-400">Supports PDF, TXT, DOC, DOCX and image files (up to 10MB)</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleProcess}
          disabled={!file || isLoading}
          className={`flex-1 px-4 py-2 font-medium rounded-md text-white 
            ${!file || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
            transition-colors duration-200`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Process Report'
          )}
        </button>
        
        <button
          onClick={toggleManualEntry}
          className="px-4 py-2 font-medium rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
        >
          {showManualEntry ? 'Hide Manual Entry' : 'Manual Entry'}
        </button>
        
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 font-medium rounded-md text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
        >
          Download Template
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="text-sm">{error}</p>
          {(error.includes('scanned') || error.includes('image-based') || error.includes('parse') || error.includes('password-protected')) && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="text-xs text-red-600">
                <strong>Help:</strong> {error.includes('password-protected') 
                  ? 'Please remove the password from your PDF before uploading.' 
                  : 'For scanned documents, our system may have difficulty extracting text accurately. Try using our template for best results.'}
              </p>
              <button 
                onClick={downloadTemplate}
                className="mt-2 text-xs underline text-blue-600 hover:text-blue-800"
              >
                Download our template for best results
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extractedText && (
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-2">Extracted Text</h3>
            <div className="max-h-60 overflow-y-auto text-sm whitespace-pre-line bg-white p-3 rounded border">
              {extractedText}
            </div>
          </div>
        )}
        
        {parsedData && (
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-2">Parsed Information</h3>
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(parsedData).map(([section, data]) => (
                <div key={section} className="mb-3">
                  <h4 className="text-sm font-medium capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  {typeof data === 'object' && data !== null ? (
                    <ul className="pl-3 text-sm">
                      {Object.entries(data as Record<string, any>).map(([key, value]) => (
                        <li key={key} className="mb-1">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value || '-'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm pl-3">{data || '-'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showManualEntry && (
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Manual Report Entry</h3>
          
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p className="text-sm">Report saved successfully!</p>
            </div>
          )}
          
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="text-sm">{saveError}</p>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveReport(); }}>
            <fieldset className="border rounded-md p-4">
              <legend className="text-sm font-medium px-2">Patient Information</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-md px-3 py-2"
                    value={parsedData?.patientInfo?.name || formData.patientInfo.name}
                    onChange={(e) => handleFormChange('patientInfo', 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-md px-3 py-2"
                    value={parsedData?.patientInfo?.age || formData.patientInfo.age}
                    onChange={(e) => handleFormChange('patientInfo', 'age', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2"
                    value={parsedData?.patientInfo?.gender || formData.patientInfo.gender}
                    onChange={(e) => handleFormChange('patientInfo', 'gender', e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Medical Record Number</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-md px-3 py-2"
                    value={parsedData?.patientInfo?.mrn || formData.patientInfo.mrn}
                    onChange={(e) => handleFormChange('patientInfo', 'mrn', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Service</label>
                  <input 
                    type="date" 
                    className="w-full border rounded-md px-3 py-2"
                    value={parsedData?.patientInfo?.dateOfService || formData.patientInfo.dateOfService}
                    onChange={(e) => handleFormChange('patientInfo', 'dateOfService', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>
            
            <div className="text-right">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Report'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}; 