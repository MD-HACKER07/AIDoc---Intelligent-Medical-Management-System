import jsPDF from 'jspdf';
import { DEFAULT_LOGO } from '../assets/medical-logo';

interface HospitalInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  country?: string;
  patientId?: string;
  dateOfBirth?: string;
}

interface ReportOptions {
  hospital?: HospitalInfo;
  patient?: PatientInfo;
  reportType: string;
  content: string;
  doctorName?: string;
  doctorSpecialty?: string;
  additionalNotes?: string;
}

// Clean text and remove markdown
const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    .normalize('NFKD')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*]+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Parse content into structured sections
const parseContent = (content: string): { title: string; items: string[] }[] => {
  const cleaned = cleanText(content);
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;
  
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
  
  lines.forEach(line => {
    // Check if it's a section header (all caps or ends with colon)
    if (line === line.toUpperCase() || line.endsWith(':')) {
      if (currentSection !== null && currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/:/g, '').trim(),
        items: []
      };
    } else if (currentSection !== null) {
      // Add as item to current section
      currentSection.items.push(line);
    } else {
      // Create a default section if none exists
      currentSection = { title: 'DETAILS', items: [line] };
    }
  });
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
};

export class MedicalReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private currentY: number;
  private hospital?: HospitalInfo;
  private margin: number = 20;
  private pageNumber: number = 1;
  
  // Modern color scheme
  private colors = {
    primary: [13, 110, 253] as [number, number, number],
    secondary: [108, 117, 125] as [number, number, number],
    success: [25, 135, 84] as [number, number, number],
    danger: [220, 53, 69] as [number, number, number],
    warning: [255, 193, 7] as [number, number, number],
    info: [13, 202, 240] as [number, number, number],
    light: [248, 249, 250] as [number, number, number],
    dark: [33, 37, 41] as [number, number, number],
    white: [255, 255, 255] as [number, number, number]
  };

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.currentY = 20;
  }

  private addModernHeader(reportType: string, hospital?: HospitalInfo) {
    // Modern gradient header
    const headerHeight = 45;
    
    // Primary color header
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Accent bar
    this.doc.setFillColor(...this.colors.info);
    this.doc.rect(0, headerHeight - 3, this.pageWidth, 3, 'F');

    // Add logo on the left
    try {
      this.doc.addImage(DEFAULT_LOGO, 'PNG', 15, 8, 25, 25);
    } catch (error) {
      console.log('Logo not added:', error);
    }

    if (hospital) {
      this.doc.setTextColor(...this.colors.white);
      this.doc.setFontSize(22);
      this.doc.setFont("helvetica", "bold");
      // Adjust position to account for logo
      this.doc.text(hospital.name.toUpperCase(), this.pageWidth / 2 + 5, 16, { align: 'center' });

      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      
      const line1: string[] = [];
      if (hospital.address) line1.push(hospital.address);
      if (hospital.city && hospital.state) line1.push(`${hospital.city}, ${hospital.state}`);
      if (line1.length > 0) {
        this.doc.text(line1.join(' | '), this.pageWidth / 2 + 5, 26, { align: 'center' });
      }
      
      const line2: string[] = [];
      if (hospital.phone) line2.push(`Tel: ${hospital.phone}`);
      if (hospital.email) line2.push(`Email: ${hospital.email}`);
      if (line2.length > 0) {
        this.doc.text(line2.join(' | '), this.pageWidth / 2 + 5, 32, { align: 'center' });
      }
    } else {
      this.doc.setTextColor(...this.colors.white);
      this.doc.setFontSize(22);
      this.doc.setFont("helvetica", "bold");
      this.doc.text('MEDICAL CENTER', this.pageWidth / 2 + 5, 20, { align: 'center' });
    }

    this.currentY = headerHeight + 10;

    // Report title with background
    const titleBoxHeight = 12;
    this.doc.setFillColor(...this.colors.light);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), titleBoxHeight, 'F');
    
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(reportType.toUpperCase(), this.pageWidth / 2, this.currentY + 8, { align: 'center' });
    
    this.currentY += titleBoxHeight + 8;

    // Date badge
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...this.colors.secondary);
    const date = new Date();
    const dateStr = `Generated: ${date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })} at ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
    this.doc.text(dateStr, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;
  }

  private addPatientTable(patient: PatientInfo) {
    const tableY = this.currentY;
    const tableHeight = 32;
    const colWidth = (this.pageWidth - (2 * this.margin)) / 2;
    
    // Table header
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(this.margin, tableY, this.pageWidth - (2 * this.margin), 10, 'F');
    
    this.doc.setTextColor(...this.colors.white);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text('PATIENT INFORMATION', this.margin + 5, tableY + 7);
    
    // Table body
    this.doc.setFillColor(...this.colors.white);
    this.doc.rect(this.margin, tableY + 10, this.pageWidth - (2 * this.margin), tableHeight - 10, 'F');
    
    // Border
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, tableY, this.pageWidth - (2 * this.margin), tableHeight, 'S');
    
    // Vertical divider
    this.doc.line(this.margin + colWidth, tableY + 10, this.margin + colWidth, tableY + tableHeight);
    
    // Content
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFontSize(9);
    
    let rowY = tableY + 17;
    
    // Left column
    this.doc.setFont("helvetica", "bold");
    this.doc.text('Name:', this.margin + 5, rowY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(patient.name, this.margin + 25, rowY);
    
    rowY += 7;
    this.doc.setFont("helvetica", "bold");
    this.doc.text('Age:', this.margin + 5, rowY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`${patient.age} years`, this.margin + 25, rowY);
    
    // Right column
    rowY = tableY + 17;
    this.doc.setFont("helvetica", "bold");
    this.doc.text('Gender:', this.margin + colWidth + 5, rowY);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(patient.gender, this.margin + colWidth + 25, rowY);
    
    rowY += 7;
    if (patient.patientId) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text('Patient ID:', this.margin + colWidth + 5, rowY);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(patient.patientId, this.margin + colWidth + 30, rowY);
    } else if (patient.country) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text('Country:', this.margin + colWidth + 5, rowY);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(patient.country, this.margin + colWidth + 30, rowY);
    }
    
    this.currentY += tableHeight + 12;
  }

  private addStructuredContent(content: string) {
    const sections = parseContent(content);
    
    sections.forEach((section, sectionIndex) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - 60) {
        this.addFooter();
        this.doc.addPage();
        this.pageNumber++;
        this.addMiniHeader();
        this.currentY = 30;
      }
      
      // Section header with colored background
      const headerHeight = 10;
      this.doc.setFillColor(...this.colors.info);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), headerHeight, 'F');
      
      this.doc.setTextColor(...this.colors.white);
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(section.title, this.margin + 5, this.currentY + 7);
      
      this.currentY += headerHeight + 5;
      
      // Section items as bullet points
      this.doc.setTextColor(...this.colors.dark);
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      
      section.items.forEach((item, itemIndex) => {
        if (this.currentY > this.pageHeight - 40) {
          this.addFooter();
          this.doc.addPage();
          this.pageNumber++;
          this.addMiniHeader();
          this.currentY = 30;
        }
        
        // Bullet point
        this.doc.setFillColor(...this.colors.primary);
        this.doc.circle(this.margin + 3, this.currentY - 2, 1.5, 'F');
        
        // Item text with wrapping
        const maxWidth = this.pageWidth - (2 * this.margin) - 10;
        const lines = this.doc.splitTextToSize(item, maxWidth);
        
        lines.forEach((line: string) => {
          if (this.currentY > this.pageHeight - 40) {
            this.addFooter();
            this.doc.addPage();
            this.pageNumber++;
            this.addMiniHeader();
            this.currentY = 30;
          }
          
          this.doc.text(line, this.margin + 10, this.currentY);
          this.currentY += 6;
        });
        
        // Add small space between items
        if (itemIndex < section.items.length - 1) {
          this.currentY += 2;
        }
      });
      
      // Space between sections
      if (sectionIndex < sections.length - 1) {
        this.currentY += 8;
      }
    });
  }

  private addMiniHeader() {
    if (this.hospital) {
      this.doc.setFillColor(...this.colors.primary);
      this.doc.rect(0, 0, this.pageWidth, 18, 'F');
      
      // Add small logo
      try {
        this.doc.addImage(DEFAULT_LOGO, 'PNG', 10, 4, 10, 10);
      } catch (error) {
        console.log('Logo not added to mini header');
      }
      
      this.doc.setTextColor(...this.colors.white);
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(this.hospital.name.toUpperCase(), this.pageWidth / 2, 12, { align: 'center' });
      
      this.doc.setTextColor(...this.colors.dark);
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 18;
    
    // Footer line
    this.doc.setDrawColor(...this.colors.secondary);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY - 2, this.pageWidth - this.margin, footerY - 2);
    
    // Footer text
    this.doc.setFontSize(7);
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.setFont("helvetica", "normal");
    
    const text = this.hospital 
      ? `${this.hospital.name} - Confidential Medical Report`
      : 'Confidential Medical Report';
    
    this.doc.text(text, this.pageWidth / 2, footerY + 3, { align: 'center' });
    
    // Page number badge
    this.doc.setFillColor(...this.colors.primary);
    this.doc.roundedRect(this.pageWidth - this.margin - 15, footerY - 5, 15, 8, 2, 2, 'F');
    this.doc.setTextColor(...this.colors.white);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.text(`${this.pageNumber}`, this.pageWidth - this.margin - 7.5, footerY + 1, { align: 'center' });
    
    // Disclaimer
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text('Confidential medical information - Handle with care', this.pageWidth / 2, footerY + 9, { align: 'center' });
  }

  private addSignatureBox(doctorName?: string, doctorSpecialty?: string) {
    this.currentY += 15;
    
    if (this.currentY > this.pageHeight - 45) {
      this.addFooter();
      this.doc.addPage();
      this.pageNumber++;
      this.addMiniHeader();
      this.currentY = 30;
    }

    const boxWidth = 70;
    const boxHeight = 25;
    const boxX = this.pageWidth - this.margin - boxWidth;
    
    // Signature box
    this.doc.setFillColor(...this.colors.light);
    this.doc.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 2, 2, 'F');
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 2, 2, 'S');
    
    // Signature line
    this.doc.setDrawColor(...this.colors.secondary);
    this.doc.line(boxX + 5, this.currentY + 12, boxX + boxWidth - 5, this.currentY + 12);
    
    // Doctor info
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.colors.dark);
    this.doc.setFont("helvetica", "bold");
    
    if (doctorName) {
      this.doc.text(doctorName, boxX + (boxWidth / 2), this.currentY + 17, { align: 'center' });
      if (doctorSpecialty) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(7);
        this.doc.setTextColor(...this.colors.secondary);
        this.doc.text(doctorSpecialty, boxX + (boxWidth / 2), this.currentY + 21, { align: 'center' });
      }
    } else {
      this.doc.setFontSize(8);
      this.doc.text('Authorized Professional', boxX + (boxWidth / 2), this.currentY + 17, { align: 'center' });
    }
  }

  public generateReport(options: ReportOptions): jsPDF {
    this.hospital = options.hospital;
    this.pageNumber = 1;

    this.addModernHeader(options.reportType, options.hospital);

    if (options.patient) {
      this.addPatientTable(options.patient);
    }

    this.addStructuredContent(options.content);

    if (options.additionalNotes) {
      this.currentY += 8;
      this.addStructuredContent(options.additionalNotes);
    }

    this.addSignatureBox(options.doctorName, options.doctorSpecialty);
    this.addFooter();

    return this.doc;
  }

  public save(filename: string) {
    this.doc.save(filename);
  }
}

export const generateMedicalReport = (options: ReportOptions, filename: string) => {
  const generator = new MedicalReportGenerator();
  generator.generateReport(options);
  generator.save(filename);
};
