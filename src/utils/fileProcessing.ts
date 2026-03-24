import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set the worker source directly
const PDFJS_WORKER_SRC = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  TEXT: 'text/plain',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_TIFF: 'image/tiff',
};

export const FILE_EXTENSIONS = {
  PDF: '.pdf',
  TEXT: '.txt',
  DOCX: '.docx',
  DOC: '.doc',
  IMAGE_JPEG: ['.jpg', '.jpeg'],
  IMAGE_PNG: '.png',
  IMAGE_TIFF: '.tiff',
};

// Error types
export enum FileProcessingErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  PARSE_ERROR = 'PARSE_ERROR',
  UNSUPPORTED_FILE = 'UNSUPPORTED_FILE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Custom error class
export class FileProcessingError extends Error {
  type: FileProcessingErrorType;
  details?: any;

  constructor(message: string, type: FileProcessingErrorType, details?: any) {
    super(message);
    this.name = 'FileProcessingError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Validate a file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds the maximum limit of 10MB (current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB)` 
    };
  }

  // Check file type and extension
  const validTypes = Object.values(SUPPORTED_FILE_TYPES);
  const extension = getFileExtension(file.name).toLowerCase();
  
  // Some browsers/systems may not correctly report file type
  // Check by extension if the reported type is not recognized
  if (!validTypes.includes(file.type)) {
    // Check if we have a valid extension
    const isPdf = ['.pdf'].includes(extension);
    const isText = ['.txt', '.text'].includes(extension);
    const isWord = ['.doc', '.docx'].includes(extension);
    const isImage = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(extension);
    
    if (isPdf || isText || isWord || isImage) {
      // Valid extension, but MIME type is off - we'll try to process anyway
      console.warn(`File MIME type "${file.type}" not recognized, but extension "${extension}" is supported. Will attempt to process.`);
      return { valid: true };
    }
    
    return { 
      valid: false, 
      error: `Unsupported file type. Please upload PDF, text, or image files.` 
    };
  }

  return { valid: true };
}

/**
 * Get the file extension from a filename
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex);
}

/**
 * Process a file and extract text based on its type
 */
export async function processFile(file: File): Promise<string> {
  if (!file) {
    throw new FileProcessingError(
      'No file provided',
      FileProcessingErrorType.FILE_NOT_FOUND
    );
  }

  try {
    const extension = getFileExtension(file.name).toLowerCase();
    
    // Handle each file type - check both MIME type and extension
    if (file.type === SUPPORTED_FILE_TYPES.PDF || extension === '.pdf') {
      return await extractTextFromPDF(file);
    } else if (file.type === SUPPORTED_FILE_TYPES.TEXT || extension === '.txt') {
      return await extractTextFromText(file);
    } else if (
      file.type === SUPPORTED_FILE_TYPES.DOCX || 
      file.type === SUPPORTED_FILE_TYPES.DOC ||
      extension === '.doc' ||
      extension === '.docx'
    ) {
      throw new FileProcessingError(
        'Document processing requires additional libraries. Please convert to PDF or text.',
        FileProcessingErrorType.UNSUPPORTED_FILE
      );
    } else if (
      file.type === SUPPORTED_FILE_TYPES.IMAGE_JPEG || 
      file.type === SUPPORTED_FILE_TYPES.IMAGE_PNG || 
      file.type === SUPPORTED_FILE_TYPES.IMAGE_TIFF ||
      ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(extension)
    ) {
      return await extractTextFromImage(file);
    } else {
      throw new FileProcessingError(
        `Unsupported file type: ${file.type}`,
        FileProcessingErrorType.INVALID_FILE_TYPE
      );
    }
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    
    console.error('File processing error:', error);
    throw new FileProcessingError(
      'Failed to process file',
      FileProcessingErrorType.UNKNOWN_ERROR,
      error
    );
  }
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    // Configure PDF.js with explicit worker source
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
    });
    
    const pdf = await loadingTask.promise;
    let extractedText = '';
    let textContentFound = false;

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        if (content.items.length > 0) {
          textContentFound = true;
          const strings = content.items.map(item => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          });
          
          extractedText += strings.join(' ') + '\n';
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        // Continue with other pages
      }
    }

    // If we couldn't extract text, try to use OCR as fallback for image-based PDFs
    if (!textContentFound || !extractedText.trim()) {
      // Try OCR with the first page
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.5 });
      
      // Create a canvas to render the PDF page
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create canvas context');
      }
      
      // Render PDF page to canvas
      await firstPage.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Use OCR on the rendered image
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const ocrText = await performOCR(dataUrl);
        
        if (ocrText && ocrText.trim()) {
          return ocrText;
        }
      } catch (ocrError) {
        console.error('OCR fallback failed:', ocrError);
      }
      
      throw new FileProcessingError(
        'No text found in PDF. The document appears to be scanned or image-based.',
        FileProcessingErrorType.PARSE_ERROR
      );
    }

    return extractedText;
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    
    console.error('PDF extraction error:', error);
    throw new FileProcessingError(
      'Failed to extract text from PDF. Please ensure the file is not corrupted or password-protected.',
      FileProcessingErrorType.PARSE_ERROR,
      error
    );
  }
}

/**
 * Helper function to read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Perform OCR on an image data URL
 */
async function performOCR(imageDataUrl: string): Promise<string> {
  try {
    const worker = await createWorker();
    const { data } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    return data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new FileProcessingError(
      'OCR processing failed for image-based PDF',
      FileProcessingErrorType.PARSE_ERROR,
      error
    );
  }
}

/**
 * Extract text from a plain text file
 */
async function extractTextFromText(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new FileProcessingError(
      'Failed to extract text from text file',
      FileProcessingErrorType.PARSE_ERROR,
      error
    );
  }
}

/**
 * Extract text from an image using OCR
 */
async function extractTextFromImage(file: File): Promise<string> {
  try {
    const worker = await createWorker();
    const imageUrl = URL.createObjectURL(file);
    const { data } = await worker.recognize(imageUrl);
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
    
    return data.text;
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new FileProcessingError(
      'Failed to extract text from image',
      FileProcessingErrorType.PARSE_ERROR,
      error
    );
  }
}

/**
 * Parse extracted text into a structured medical report format
 */
export function parseToMedicalReport(text: string): Record<string, any> {
  // This is a simplified implementation
  // In a real application, you would use NLP or regex patterns
  // to extract structured information from the text
  
  // Define the report structure
  const report = {
    patientInfo: {
      name: extractField(text, 'Name', 'Patient'),
      age: extractField(text, 'Age'),
      gender: extractField(text, 'Gender', 'Sex'),
      mrn: extractField(text, 'MRN', 'Medical Record Number', 'Record Number'),
      dateOfService: extractField(text, 'Date of Service', 'Service Date', 'Visit Date')
    },
    clinicalInfo: {
      chiefComplaint: extractField(text, 'Chief Complaint', 'Complaint', 'Reason for Visit'),
      historyOfPresentIllness: extractField(text, 'History of Present Illness', 'Present Illness', 'HPI'),
      pastMedicalHistory: extractField(text, 'Past Medical History', 'Medical History', 'PMH'),
      medications: extractField(text, 'Medications', 'Current Medications'),
      allergies: extractField(text, 'Allergies', 'Known Allergies')
    },
    physicalExam: {
      vitalSigns: extractField(text, 'Vital Signs', 'Vitals'),
      generalAppearance: extractField(text, 'General Appearance', 'Appearance'),
      examFindings: extractField(text, 'Examination Findings', 'Physical Exam', 'Exam Findings')
    },
    diagnosticResults: {
      labTests: extractField(text, 'Laboratory Tests', 'Lab Tests', 'Labs'),
      imagingStudies: extractField(text, 'Imaging Studies', 'Imaging', 'Radiology'),
      otherTests: extractField(text, 'Other Tests', 'Additional Tests')
    },
    assessment: {
      diagnosis: extractField(text, 'Diagnosis', 'Impression', 'Assessment'),
      clinicalReasoning: extractField(text, 'Clinical Reasoning', 'Reasoning')
    },
    plan: {
      treatmentRecommendations: extractField(text, 'Treatment Recommendations', 'Treatment Plan', 'Plan'),
      medicationsPrescribed: extractField(text, 'Medications Prescribed', 'Prescribed Medications', 'New Medications'),
      followUpInstructions: extractField(text, 'Follow-up Instructions', 'Follow-up', 'Follow Up'),
      referrals: extractField(text, 'Referrals')
    },
    additionalNotes: extractField(text, 'Additional Notes', 'Notes', 'Comments')
  };
  
  return report;
}

/**
 * Helper function to extract specific fields from text
 */
function extractField(text: string, ...possibleHeaders: string[]): string {
  // Case insensitive search for any of the possible headers
  const regex = new RegExp(`(${possibleHeaders.join('|')})\\s*:?\\s*([^\\n]+)(\\n|$)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : '';
}

/**
 * Get a readable file type name
 */
export function getFileTypeName(fileType: string): string {
  switch (fileType) {
    case SUPPORTED_FILE_TYPES.PDF:
      return 'PDF';
    case SUPPORTED_FILE_TYPES.TEXT:
      return 'Text';
    case SUPPORTED_FILE_TYPES.DOCX:
      return 'Word Document';
    case SUPPORTED_FILE_TYPES.DOC:
      return 'Word Document';
    case SUPPORTED_FILE_TYPES.IMAGE_JPEG:
    case SUPPORTED_FILE_TYPES.IMAGE_PNG:
    case SUPPORTED_FILE_TYPES.IMAGE_TIFF:
      return 'Image';
    default:
      return 'Unknown';
  }
} 