import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for PDF.js
const pdfjsVersion = '3.11.174'; // This should match your installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

// Helper function to read file as an ArrayBuffer
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to read file as a Data URL
const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Extract text from a file (PDF or image) using modern libraries
 * @param file The file to extract text from
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  console.log('Extracting text from file:', file.name, file.type);
  
  try {
    // Handle PDFs
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }
    
    // Handle images
    else if (file.type.startsWith('image/')) {
      return await extractTextFromImage(file);
    }
    
    // Unsupported file type
    else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

/**
 * Extract text from a PDF file using PDF.js
 * @param file PDF file
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Extracting text from PDF using PDF.js');
    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let text = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      try {
        console.log(`Processing page ${i} of ${numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Process text items
        const pageText = textContent.items
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
        
        text += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        text += `[Error extracting text from page ${i}]\n\n`;
      }
    }
    
    // If no text was extracted, try OCR as fallback
    if (text.trim().length < 100) {
      console.log('Minimal text extracted from PDF, trying OCR as fallback');
      return await extractTextFromPDFWithOCR(file);
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF with PDF.js:', error);
    console.log('Falling back to OCR method');
    return await extractTextFromPDFWithOCR(file);
  }
}

/**
 * Extract text from a PDF file using OCR
 * @param file PDF file
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPDFWithOCR(file: File): Promise<string> {
  try {
    console.log('Using OCR for PDF text extraction');
    // This is a simplified method that uses OCR on the PDF
    const dataUrl = await readFileAsDataUrl(file);
    
    // Use Tesseract to extract text
    const worker = await createWorker();
    // @ts-ignore - Tesseract worker methods
    await worker.loadLanguage('eng');
    // @ts-ignore - Tesseract worker methods
    await worker.initialize('eng');
    
    // Set parameters for better text recognition
    // @ts-ignore - Tesseract worker methods
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
      preserve_interword_spaces: '1',
    });
    
    // @ts-ignore - Tesseract worker methods
    const result = await worker.recognize(dataUrl);
    // @ts-ignore - Tesseract worker methods
    await worker.terminate();
    
    return result.data.text || '';
  } catch (error) {
    console.error('Error in PDF OCR extraction:', error);
    return 'Failed to extract text from PDF. Please try uploading a different format or type the information manually.';
  }
}

/**
 * Extract text from an image file using Tesseract.js
 * @param file Image file
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromImage(file: File): Promise<string> {
  try {
    console.log('Extracting text from image using Tesseract.js');
    const dataUrl = await readFileAsDataUrl(file);
    
    // Initialize Tesseract worker
    const worker = await createWorker();
    // @ts-ignore - Tesseract worker methods
    await worker.loadLanguage('eng');
    // @ts-ignore - Tesseract worker methods
    await worker.initialize('eng');
    
    // Set parameters for better text recognition
    // @ts-ignore - Tesseract worker methods
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
      preserve_interword_spaces: '1',
    });
    
    // Recognize text from image
    // @ts-ignore - Tesseract worker methods
    const result = await worker.recognize(dataUrl);
    
    // Terminate worker
    // @ts-ignore - Tesseract worker methods
    await worker.terminate();
    
    return result.data.text || '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

/**
 * Enhanced extraction for medical documents with progress updates
 * @param file The file to extract text from
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to the extracted text
 */
export async function enhancedMedicalDocExtraction(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Starting enhanced text extraction for medical document...');
    }
    
    let text = '';
    
    // Handle PDFs with medical optimizations
    if (file.type === 'application/pdf') {
      if (updateStatus) {
        updateStatus('Processing medical PDF document...');
      }
      
      try {
        // First try PDF.js extraction
        if (updateStatus) {
          updateStatus('Extracting text using PDF.js...');
        }
        
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const numPages = pdf.numPages;
        
        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
          if (updateStatus) {
            updateStatus(`Processing page ${i} of ${numPages}...`);
          }
          
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Process text items
            const pageText = textContent.items
              .map(item => 'str' in item ? item.str : '')
              .join(' ');
            
            text += pageText + '\n\n';
          } catch (pageError) {
            console.error(`Error extracting text from page ${i}:`, pageError);
          }
        }
        
        // If minimal text was extracted, try OCR
        if (text.trim().length < 100) {
          if (updateStatus) {
            updateStatus('Minimal text extracted, applying OCR for better results...');
          }
          
          // Apply OCR
          const dataUrl = await readFileAsDataUrl(file);
          const worker = await createWorker();
          // @ts-ignore - Tesseract worker methods
          await worker.loadLanguage('eng');
          // @ts-ignore - Tesseract worker methods
          await worker.initialize('eng');
          
          // Set parameters for better medical document recognition
          // @ts-ignore - Tesseract worker methods
          await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
            preserve_interword_spaces: '1',
          });
          
          // @ts-ignore - Tesseract worker methods
          const result = await worker.recognize(dataUrl);
          text = result.data.text || '';
          
          // @ts-ignore - Tesseract worker methods
          await worker.terminate();
        }
      } catch (pdfError) {
        console.error('Error with PDF.js extraction:', pdfError);
        
        if (updateStatus) {
          updateStatus('Using OCR fallback for this document...');
        }
        
        // Fall back to OCR
        const dataUrl = await readFileAsDataUrl(file);
        const worker = await createWorker();
        // @ts-ignore - Tesseract worker methods
        await worker.loadLanguage('eng');
        // @ts-ignore - Tesseract worker methods
        await worker.initialize('eng');
        
        // @ts-ignore - Tesseract worker methods
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
          preserve_interword_spaces: '1',
        });
        
        // @ts-ignore - Tesseract worker methods
        const result = await worker.recognize(dataUrl);
        text = result.data.text || '';
        
        // @ts-ignore - Tesseract worker methods
        await worker.terminate();
      }
    }
    // Handle images with enhanced OCR settings
    else if (file.type.startsWith('image/')) {
      if (updateStatus) {
        updateStatus('Processing medical image with enhanced OCR settings...');
      }
      
      // Initialize Tesseract worker with enhanced settings
      const worker = await createWorker();
      // @ts-ignore - Tesseract worker methods
      await worker.loadLanguage('eng');
      // @ts-ignore - Tesseract worker methods
      await worker.initialize('eng');
      
      // Set parameters for better medical document recognition
      // @ts-ignore - Tesseract worker methods
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
        preserve_interword_spaces: '1',
      });
      
      if (updateStatus) {
        updateStatus('Applying OCR to medical document image...');
      }
      
      // Apply OCR
      const dataUrl = await readFileAsDataUrl(file);
      // @ts-ignore - Tesseract worker methods
      const result = await worker.recognize(dataUrl);
      text = result.data.text || '';
      
      // Terminate worker
      // @ts-ignore - Tesseract worker methods
      await worker.terminate();
    } else {
      throw new Error(`Unsupported file type for medical document extraction: ${file.type}`);
    }
    
    // Post-process the extracted text for medical reports
    if (updateStatus) {
      updateStatus('Post-processing extracted medical data...');
    }
    
    const processedText = postProcessMedicalText(text);
    
    if (updateStatus) {
      updateStatus('Text extraction complete. Analyzing medical content...');
    }
    
    return processedText;
  } catch (error) {
    console.error('Error in enhanced medical document extraction:', error);
    throw error;
  }
}

/**
 * Post-process extracted text from medical documents to improve quality
 * @param text Raw extracted text
 * @returns Processed text
 */
function postProcessMedicalText(text: string): string {
  if (!text) return '';
  
  // Replace multiple spaces with a single space
  let processed = text.replace(/\s+/g, ' ');
  
  // Replace multiple newlines with a single newline
  processed = processed.replace(/\n+/g, '\n');
  
  // Fix common OCR errors in medical terms
  const medicalTermsCorrections: Record<string, string> = {
    'dlagnosls': 'diagnosis',
    'patlent': 'patient',
    'dlabetes': 'diabetes',
    'hypertenslon': 'hypertension',
    'cardlac': 'cardiac',
    'chronlc': 'chronic',
    'prescrlption': 'prescription',
    'medlcation': 'medication',
    'medlcal': 'medical',
    'hospltai': 'hospital',
    'hospitai': 'hospital',
    'physiclan': 'physician',
    'wlth': 'with',
    'Patlenl': 'Patient',
    'Dlagnosls': 'Diagnosis',
    'Medlcations': 'Medications',
    'Allergles': 'Allergies',
    'Hislory': 'History',
    'Histoly': 'History',
    'Laboratoly': 'Laboratory',
    'Slgnature': 'Signature',
    'mgidl': 'mg/dl',
    'mmHg': 'mmHg', // Preserve correct mmHg
    'mglday': 'mg/day',
    'mglml': 'mg/ml'
  };
  
  // Apply medical term corrections
  Object.entries(medicalTermsCorrections).forEach(([incorrect, correct]) => {
    processed = processed.replace(new RegExp(incorrect, 'gi'), correct);
  });
  
  // Fix date formats (various formats to YYYY-MM-DD where possible)
  processed = processed.replace(
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, 
    (match, d, m, y) => {
      // Attempt to normalize the date format
      // If year appears to be in short form (2 digits), assume it's 2000+
      const year = y.length === 2 ? `20${y}` : y;
      // Format as YYYY-MM-DD
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  );
  
  // Fix common measurement units
  processed = processed.replace(/(\d+)mc?g/gi, '$1μg'); // Fix micrograms
  processed = processed.replace(/(\d+)C\b/gi, '$1°C'); // Fix Celsius
  
  // Clean up extra punctuation and spaces
  processed = processed.replace(/\s+\./g, '.');
  processed = processed.replace(/\s+,/g, ',');
  processed = processed.replace(/\s+:/g, ':');
  processed = processed.replace(/\(\s+/g, '(');
  processed = processed.replace(/\s+\)/g, ')');
  
  return processed.trim();
}

/**
 * Get specialist recommendations based on document name/content
 * @param fileName Name of the uploaded file
 * @returns Array of specialist recommendations
 */
export function getSpecialistRecommendations(fileName: string): any[] {
  // Parse file name for clues about medical specialties
  const fileNameLower = fileName.toLowerCase();
  
  const specialistMap: Record<string, { name: string, specialty: string }[]> = {
    'blood': [
      { name: 'Dr. Rakesh Patil', specialty: 'Hematologist' },
    ],
    'cbc': [
      { name: 'Dr. Rakesh Patil', specialty: 'General Practitioner' },
    ],
    'liver': [
      { name: 'Dr. Sharad Deshmukh', specialty: 'Gastroenterologist' },
    ],
    'kidney': [
      { name: 'Dr. Kiran Gores', specialty: 'Nephrologist' },
    ],
    'heart': [
      { name: 'Dr. Ashutosh Sahu', specialty: 'Cardiologist' },
    ],
    'echo': [
      { name: 'Dr. Ashutosh Sahu', specialty: 'Cardiologist' },
    ],
    'lung': [
      { name: 'Dr. Bharat Trivedi', specialty: 'Pulmonologist' },
    ],
    'brain': [
      { name: 'Dr. Shailesh Shah', specialty: 'Neurologist' },
    ],
    'thyroid': [
      { name: 'Dr. Sujit Arun Chandratreya', specialty: 'Endocrinologist' },
    ],
    'skin': [
      { name: 'Dr. Milind Deshmukh', specialty: 'Dermatologist' },
    ],
  };
  
  // Find matches
  const recommendations: { name: string, specialty: string }[] = [];
  
  Object.entries(specialistMap).forEach(([keyword, specialists]) => {
    if (fileNameLower.includes(keyword)) {
      recommendations.push(...specialists);
    }
  });
  
  // Return unique recommendations
  return Array.from(new Set(recommendations.map(r => JSON.stringify(r))))
    .map(s => JSON.parse(s));
}

/**
 * Format specialist recommendations for display
 * @param recommendations Array of specialist recommendations
 * @returns Formatted string of recommendations
 */
export function formatSpecialistRecommendations(
  recommendations: { name: string, specialty: string }[]
): string {
  if (recommendations.length === 0) {
    return '';
  }
  
  return recommendations
    .map(({ name, specialty }) => `- ${name} (${specialty})`)
    .join('\n');
}

// Export a simple version for backward compatibility
export async function extractTextFromFileWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    if (onProgress) {
      onProgress(10);
    }
    
    const text = await extractTextFromFile(file);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text with progress:', error);
    throw error;
  }
}

/**
 * Extract patient information from medical report text
 * @param text The processed text from medical report
 * @returns Object containing patient information
 */
export function extractPatientInfo(text: string): {
  name?: string;
  age?: string;
  gender?: string;
  patientId?: string;
} {
  const patientInfo: {
    name?: string;
    age?: string;
    gender?: string;
    patientId?: string;
  } = {};

  // Extract patient name - common patterns in medical reports
  const nameRegexes = [
    /patient\s*name\s*:?\s*([A-Za-z\s\.]+?)(?:\s*\(|\s*,|\s*\n|\s*\d|$)/i,
    /name\s*:?\s*([A-Za-z\s\.]+?)(?:\s*\(|\s*,|\s*\n|\s*\d|$)/i,
    /patient\s*:?\s*([A-Za-z\s\.]+?)(?:\s*\(|\s*,|\s*\n|\s*\d|$)/i,
  ];

  for (const regex of nameRegexes) {
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 2) {
      patientInfo.name = match[1].trim();
      break;
    }
  }

  // Extract age
  const ageRegexes = [
    /age\s*:?\s*(\d+)\s*(?:years|yrs|year|yr|y\.o\.?|y\/o)?/i,
    /(\d+)\s*(?:years|yrs|year|yr|y\.o\.?|y\/o)\s*(?:old)?/i,
    /patient\s*:.*?(\d+)\s*(?:years|yrs|year|yr|y\.o\.?|y\/o)/i,
  ];

  for (const regex of ageRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      patientInfo.age = match[1];
      break;
    }
  }

  // Extract gender
  const genderMatch = text.match(/(?:gender|sex)\s*:?\s*(male|female|m|f)/i);
  if (genderMatch && genderMatch[1]) {
    const gender = genderMatch[1].toLowerCase();
    patientInfo.gender = gender === 'm' ? 'Male' : gender === 'f' ? 'Female' : 
                         gender.charAt(0).toUpperCase() + gender.slice(1);
  }

  // Extract patient ID if available
  const idMatch = text.match(/(?:patient\s*id|id\s*number|patient\s*number)\s*:?\s*([A-Za-z0-9\-]+)/i);
  if (idMatch && idMatch[1]) {
    patientInfo.patientId = idMatch[1];
  }

  return patientInfo;
}

/**
 * Analyze medical report and identify key findings
 * @param text The processed text from medical report
 * @returns Object containing analysis results
 */
export function analyzeMedicalReport(text: string): {
  abnormalFindings: string[];
  normalFindings: string[];
  testResults: Record<string, string>;
  summary: string;
} {
  const analysis = {
    abnormalFindings: [] as string[],
    normalFindings: [] as string[],
    testResults: {} as Record<string, string>,
    summary: ''
  };

  // Check for common test results and their values
  const commonTests = [
    { name: 'Hemoglobin', regex: /(?:hemoglobin|hgb|hb)\s*:?\s*([\d\.]+)\s*(?:g\/dl|g\/dL)/i },
    { name: 'WBC', regex: /(?:white\s*blood\s*cells|wbc)\s*:?\s*([\d\.,]+)\s*(?:\/mm3|\/mm\^3|\/μl|\/ul|\/μL|\/uL|x10\^3\/μl)/i },
    { name: 'RBC', regex: /(?:red\s*blood\s*cells|rbc)\s*:?\s*([\d\.,]+)\s*(?:\/mm3|\/mm\^3|\/μl|\/ul|\/μL|\/uL|x10\^6\/μl)/i },
    { name: 'Platelets', regex: /(?:platelets|plt)\s*:?\s*([\d\.,]+)\s*(?:\/mm3|\/mm\^3|\/μl|\/ul|\/μL|\/uL|x10\^3\/μl)/i },
    { name: 'Glucose', regex: /(?:glucose|sugar)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'Creatinine', regex: /(?:creatinine)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'BUN', regex: /(?:blood\s*urea\s*nitrogen|bun)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'Cholesterol', regex: /(?:total\s*cholesterol|cholesterol)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'HDL', regex: /(?:hdl|hdl-c|high\s*density\s*lipoprotein)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'LDL', regex: /(?:ldl|ldl-c|low\s*density\s*lipoprotein)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'Triglycerides', regex: /(?:triglycerides|tg)\s*:?\s*([\d\.]+)\s*(?:mg\/dl|mg\/dL)/i },
    { name: 'AST', regex: /(?:ast|sgot)\s*:?\s*([\d\.]+)\s*(?:u\/l|U\/L)/i },
    { name: 'ALT', regex: /(?:alt|sgpt)\s*:?\s*([\d\.]+)\s*(?:u\/l|U\/L)/i },
    { name: 'TSH', regex: /(?:tsh|thyroid\s*stimulating\s*hormone)\s*:?\s*([\d\.]+)\s*(?:mIU\/L|μIU\/mL)/i },
    { name: 'BP', regex: /(?:blood\s*pressure|bp)\s*:?\s*(\d+\/\d+)\s*(?:mmHg)?/i },
  ];

  // Extract test results
  commonTests.forEach(test => {
    const match = text.match(test.regex);
    if (match && match[1]) {
      analysis.testResults[test.name] = match[1];
    }
  });

  // Look for abnormal findings
  const abnormalKeywords = [
    /abnormal/i, /elevated/i, /increased/i, /decreased/i, /positive/i, 
    /irregular/i, /deviations/i, /atypical/i, /anomaly/i, /high/i, /low/i
  ];

  // Split text into sentences for analysis
  const sentences = text.split(/\.|\n/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    // Check if the sentence contains abnormal keywords
    if (abnormalKeywords.some(keyword => keyword.test(sentence))) {
      // Clean up the sentence
      const cleanSentence = sentence.trim().replace(/\s+/g, ' ') + '.';
      if (cleanSentence.length > 10) {
        analysis.abnormalFindings.push(cleanSentence);
      }
    } 
    // Check for sentences that explicitly mention normal findings
    else if (/normal|within\s*range|negative|unremarkable/i.test(sentence)) {
      const cleanSentence = sentence.trim().replace(/\s+/g, ' ') + '.';
      if (cleanSentence.length > 10) {
        analysis.normalFindings.push(cleanSentence);
      }
    }
  });

  // Generate summary
  let summary = '';
  
  // Add key findings to summary
  if (analysis.abnormalFindings.length > 0) {
    summary += `Key findings: ${analysis.abnormalFindings.length} abnormal findings detected. `;
    
    // Include up to 3 most important abnormal findings
    if (analysis.abnormalFindings.length > 0) {
      const topFindings = analysis.abnormalFindings.slice(0, 3);
      summary += `Most notable: ${topFindings.join(' ')} `;
    }
  } else {
    summary += 'No significant abnormal findings detected. ';
  }
  
  // Add test result summary
  const testCount = Object.keys(analysis.testResults).length;
  if (testCount > 0) {
    summary += `${testCount} test results extracted. `;
  }
  
  analysis.summary = summary.trim();
  
  return analysis;
}

/**
 * Generate doctor recommendations based on analyzed report
 * @param reportAnalysis The analysis of the medical report
 * @param fileName Optional file name for more context
 * @returns Array of recommended actions
 */
export function generateRecommendations(
  reportAnalysis: ReturnType<typeof analyzeMedicalReport>,
  fileName?: string
): string[] {
  const recommendations: string[] = [];
  
  // Check if there are abnormal findings
  if (reportAnalysis.abnormalFindings.length > 0) {
    recommendations.push('Schedule a follow-up appointment to discuss abnormal results');
    
    // Add specific recommendations based on the findings
    if (reportAnalysis.abnormalFindings.some(finding => 
      /cholesterol|ldl|triglyceride/i.test(finding))) {
      recommendations.push('Consider diet and lifestyle modifications to improve cholesterol levels');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /blood\s*pressure|hypertension/i.test(finding))) {
      recommendations.push('Monitor blood pressure regularly and consider consultation with a cardiologist');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /glucose|sugar|diabetes|a1c|hba1c/i.test(finding))) {
      recommendations.push('Consult with an endocrinologist for blood sugar management');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /liver|ast|alt|hepatic/i.test(finding))) {
      recommendations.push('Follow up with gastroenterologist for liver function evaluation');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /kidney|renal|creatinine|bun/i.test(finding))) {
      recommendations.push('Consider nephrology consultation for kidney function assessment');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /thyroid|tsh|t3|t4/i.test(finding))) {
      recommendations.push('Follow up with endocrinologist for thyroid evaluation');
    }
    
    if (reportAnalysis.abnormalFindings.some(finding => 
      /blood|anemia|hemoglobin|wbc|rbc|platelets/i.test(finding))) {
      recommendations.push('Consider hematology consultation for blood work evaluation');
    }
  } else {
    recommendations.push('Maintain regular health check-ups as per age-appropriate guidelines');
    recommendations.push('Continue with current health management plan');
  }
  
  // Add specific recommendations based on test results
  const testResults = reportAnalysis.testResults;
  
  if (testResults['Glucose'] && parseFloat(testResults['Glucose']) > 125) {
    recommendations.push('Consider diabetes screening or management plan');
  }
  
  if (testResults['BP']) {
    const bp = testResults['BP'].split('/');
    if (bp.length === 2 && (parseInt(bp[0]) > 140 || parseInt(bp[1]) > 90)) {
      recommendations.push('Monitor blood pressure and consider hypertension management');
    }
  }

  // Add generic preventive recommendations
  recommendations.push('Maintain a balanced diet and regular physical activity');
  
  return recommendations;
}

/**
 * Improved text extraction with enhanced error handling and preprocessing
 * @param file The file to extract text from
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to the extracted text
 */
export async function improvedMedicalTextExtraction(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Starting improved extraction process...');
    }
    
    // Special handling for different file types
    if (file.type === 'application/pdf') {
      if (updateStatus) {
        updateStatus('Processing PDF with enhanced settings...');
      }
      return await extractTextFromPDFWithFallbacks(file, updateStatus);
    } 
    else if (file.type.startsWith('image/')) {
      if (updateStatus) {
        updateStatus('Processing image with advanced OCR settings...');
      }
      return await extractTextFromImageWithPreprocessing(file, updateStatus);
    }
    else {
      throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF or image file.`);
    }
  } catch (error) {
    console.error('Error in improved medical text extraction:', error);
    throw new Error('Could not process your medical report file successfully. This is common with certain scanned documents and image formats.');
  }
}

/**
 * Extract text from PDF with multiple fallback methods
 * @param file PDF file
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPDFWithFallbacks(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Attempting primary PDF text extraction...');
    }
    
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let text = '';
    
    for (let i = 1; i <= numPages; i++) {
      if (updateStatus) {
        updateStatus(`Processing page ${i} of ${numPages} (primary method)...`);
      }
      
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
        
        text += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
      }
    }
    
    // Check if we got meaningful text
    if (text.trim().length > 100) {
      return text;
    }
    
    // Fallback 1: Try OCR on the PDF
    if (updateStatus) {
      updateStatus('Minimal text found. Trying OCR fallback method...');
    }
    
    const ocrText = await extractTextFromPDFWithOCR(file);
    if (ocrText.trim().length > 100) {
      return ocrText;
    }
    
    // Fallback 2: Try rendering PDF pages as images then OCR
    if (updateStatus) {
      updateStatus('Trying advanced fallback: Rendering pages as images for OCR...');
    }
    
    return await extractTextFromPDFAsImages(file, updateStatus);
  } catch (error) {
    console.error('All PDF extraction methods failed:', error);
    throw new Error('Failed to extract text from the PDF. The file may be corrupted or contain only scanned images.');
  }
}

/**
 * Extract text from PDF by rendering pages as images then applying OCR
 * @param file PDF file
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPDFAsImages(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Processing PDF by converting pages to images...');
    }
    
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let allText = '';
    
    // Process each page
    for (let i = 1; i <= numPages; i++) {
      if (updateStatus) {
        updateStatus(`Processing page ${i} of ${numPages} as image...`);
      }
      
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create a canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not create canvas context');
        }
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Use Tesseract OCR on the rendered image
        if (updateStatus) {
          updateStatus(`Applying OCR to page ${i}...`);
        }
        
        const worker = await createWorker();
        // @ts-ignore - Tesseract worker methods
        await worker.loadLanguage('eng');
        // @ts-ignore - Tesseract worker methods
        await worker.initialize('eng');
        
        // Set parameters for better medical document recognition
        // @ts-ignore - Tesseract worker methods
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
          preserve_interword_spaces: '1',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
        });
        
        // @ts-ignore - Tesseract worker methods
        const result = await worker.recognize(dataUrl);
        // @ts-ignore - Tesseract worker methods
        await worker.terminate();
        
        allText += result.data.text + '\n\n';
      } catch (pageError) {
        console.error(`Error processing page ${i} as image:`, pageError);
      }
    }
    
    return allText;
  } catch (error) {
    console.error('Error in PDF-to-image extraction:', error);
    throw error;
  }
}

/**
 * Extract text from image with preprocessing for better quality
 * @param file Image file
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromImageWithPreprocessing(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Preprocessing image for optimal text extraction...');
    }
    
    // Read the image file
    const dataUrl = await readFileAsDataUrl(file);
    
    // Apply OCR directly first to see if it works without preprocessing
    if (updateStatus) {
      updateStatus('Applying OCR to medical document image...');
    }
    
    // Initialize Tesseract worker with enhanced settings
    const worker = await createWorker();
    try {
      // @ts-ignore - Tesseract worker methods
      await worker.loadLanguage('eng');
      // @ts-ignore - Tesseract worker methods
      await worker.initialize('eng');
      
      // Set parameters for better medical document recognition
      // @ts-ignore - Tesseract worker methods
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
        preserve_interword_spaces: '1',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
      });
      
      // @ts-ignore - Tesseract worker methods
      const result = await worker.recognize(dataUrl);
      const text = result.data.text || '';
      
      // If we got a reasonable amount of text, return it
      if (text.trim().length > 50) {
        // @ts-ignore - Tesseract worker methods
        await worker.terminate();
        return text;
      }
      
      // Otherwise try with preprocessing
      if (updateStatus) {
        updateStatus('Basic OCR insufficient. Applying image preprocessing...');
      }
    } catch (ocrError) {
      console.warn('Basic OCR failed, trying with preprocessing:', ocrError);
      if (updateStatus) {
        updateStatus('Enhancing image for better text recognition...');
      }
    }
    
    // Try with preprocessing if simple OCR didn't yield good results
    try {
      // Load the image for preprocessing
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => reject(new Error('Failed to load image for preprocessing'));
        img.src = dataUrl;
      });
      
      // Create a canvas for preprocessing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context for image preprocessing');
      }
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply preprocessing to improve OCR accuracy
      if (updateStatus) {
        updateStatus('Applying contrast enhancement for text clarity...');
      }
      
      try {
        // Get image data - wrapped in try-catch as this can fail on some images
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple preprocessing: increase contrast and convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Convert to grayscale
          const gray = 0.3 * r + 0.59 * g + 0.11 * b;
          
          // Increase contrast
          const contrast = 1.5; // Contrast factor
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newValue = factor * (gray - 128) + 128;
          
          // Apply thresholding for better text separation
          const threshold = 150;
          const value = newValue > threshold ? 255 : 0;
          
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        
        // Put the modified data back
        ctx.putImageData(imageData, 0, 0);
      } catch (imageDataError) {
        console.warn('Image preprocessing failed, continuing with original image:', imageDataError);
        // Redraw original image if preprocessing fails
        ctx.drawImage(img, 0, 0);
      }
      
      // Get the processed image
      const enhancedDataUrl = canvas.toDataURL('image/png');
      
      if (updateStatus) {
        updateStatus('Applying OCR to enhanced image...');
      }
      
      // @ts-ignore - Tesseract worker methods
      const result = await worker.recognize(enhancedDataUrl);
      // @ts-ignore - Tesseract worker methods
      await worker.terminate();
      
      if (updateStatus) {
        updateStatus('OCR complete. Processing extracted text...');
      }
      
      return result.data.text || '';
    } catch (preprocessingError) {
      console.error('Image preprocessing failed:', preprocessingError);
      
      // Try one more time with the original image but different OCR settings
      if (updateStatus) {
        updateStatus('Trying alternative OCR method...');
      }
      
      // @ts-ignore - Tesseract worker methods
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/<>?!@#$%^&*()_+-=[]{}|\'"\\ ',
        preserve_interword_spaces: '1',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      });
      
      // @ts-ignore - Tesseract worker methods
      const result = await worker.recognize(dataUrl);
      // @ts-ignore - Tesseract worker methods
      await worker.terminate();
      
      return result.data.text || '';
    }
  } catch (error) {
    console.error('Error in image processing and OCR:', error);
    throw new Error('Unable to process the medical image. Please try a different format or a clearer scan.');
  }
}

/**
 * Updated entry point for medical document extraction with better error handling
 * @param file The file to process
 * @param updateStatus Optional callback for status updates
 * @returns Promise resolving to extracted text
 */
export async function extractMedicalDocumentWithRetry(
  file: File,
  updateStatus?: (status: string) => void
): Promise<string> {
  try {
    if (updateStatus) {
      updateStatus('Initiating document processing...');
    }
    
    try {
      // First attempt with standard extraction
      if (updateStatus) {
        updateStatus('Attempting standard extraction method...');
      }
      const text = await enhancedMedicalDocExtraction(file, updateStatus);
      
      // If we got meaningful text, return it
      if (text.trim().length > 50) {
        return text;
      }
      
      throw new Error('Standard extraction yielded insufficient text');
    } catch (firstError) {
      console.warn('Standard extraction failed, trying improved methods:', firstError);
      
      if (updateStatus) {
        updateStatus('Standard extraction unsuccessful. Trying alternative methods...');
      }
      
      // Second attempt with improved extraction
      return await improvedMedicalTextExtraction(file, updateStatus);
    }
  } catch (error) {
    console.error('All extraction methods failed:', error);
    throw new Error('Could not process your medical report file. Please ensure it contains readable text or try a different format.');
  }
} 