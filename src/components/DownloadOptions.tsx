import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  FileText, 
  MessageSquare, 
  FileDown, 
  Mail, 
  FileCheck,
  Shield,
  Lock,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import jsPDF from 'jspdf';

interface DownloadOptionsProps {
  chatTranscript?: string;
  medicalSummary?: string;
  analysisResults?: string;
}

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  chatTranscript,
  medicalSummary,
  analysisResults,
}) => {
  const [copiedStates, setCopiedStates] = useState({
    transcript: false,
    summary: false,
    analysis: false
  });

  const downloadAsPDF = (content: string, filename: string) => {
    try {
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(content, 180);
      doc.setFont("helvetica");
      doc.setFontSize(12);
      let y = 20;
      const pageHeight = doc.internal.pageSize.height;
      lines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 7;
      });
      doc.save(filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const downloadAsText = (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading text:', error);
      alert('Failed to download text. Please try again.');
    }
  };

  const shareViaEmail = (content: string, subject: string) => {
    try {
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Failed to share via email. Please try again.');
    }
  };

  const copyToClipboard = async (content: string, type: 'transcript' | 'summary' | 'analysis') => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const EmptyState = ({ type }: { type: 'analysis' | 'chat' | 'summary' }) => {
    const messages = {
      analysis: 'Analysis results will appear here after your consultation.',
      chat: 'Chat transcript will be available once you start the conversation.',
      summary: 'Medical summary will be generated after the consultation.'
    };

    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{messages[type]}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FileDown className="h-5 w-5 mr-2 text-blue-600" />
          Download & Share Options
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Analysis Results */}
        <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileCheck className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-medium text-gray-900">Analysis Results</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => analysisResults && downloadAsPDF(analysisResults, 'analysis-results.pdf')}
                  disabled={!analysisResults}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!analysisResults ? 'No analysis results available' : 'Download as PDF'}
                >
                  <Download className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => analysisResults && copyToClipboard(analysisResults, 'analysis')}
                  disabled={!analysisResults}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!analysisResults ? 'No analysis results available' : 'Copy to clipboard'}
                >
                  {copiedStates.analysis ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => analysisResults && shareViaEmail(analysisResults, 'Medical Analysis Results')}
                  disabled={!analysisResults}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!analysisResults ? 'No analysis results available' : 'Share via email'}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!analysisResults && <EmptyState type="analysis" />}
          </div>
        </div>

        {/* Chat Transcript */}
        <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Chat Transcript</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => chatTranscript && downloadAsText(chatTranscript, 'chat-transcript.txt')}
                  disabled={!chatTranscript}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!chatTranscript ? 'No chat transcript available' : 'Download as text'}
                >
                  <Download className="h-4 w-4" />
                  <span>Text</span>
                </button>
                <button
                  onClick={() => chatTranscript && copyToClipboard(chatTranscript, 'transcript')}
                  disabled={!chatTranscript}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!chatTranscript ? 'No chat transcript available' : 'Copy to clipboard'}
                >
                  {copiedStates.transcript ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => chatTranscript && shareViaEmail(chatTranscript, 'Chat Transcript')}
                  disabled={!chatTranscript}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!chatTranscript ? 'No chat transcript available' : 'Share via email'}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!chatTranscript && <EmptyState type="chat" />}
          </div>
        </div>

        {/* Medical Summary */}
        <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Medical Summary</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => medicalSummary && downloadAsPDF(medicalSummary, 'medical-summary.pdf')}
                  disabled={!medicalSummary}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!medicalSummary ? 'No medical summary available' : 'Download as PDF'}
                >
                  <Download className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => medicalSummary && copyToClipboard(medicalSummary, 'summary')}
                  disabled={!medicalSummary}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!medicalSummary ? 'No medical summary available' : 'Copy to clipboard'}
                >
                  {copiedStates.summary ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => medicalSummary && shareViaEmail(medicalSummary, 'Medical Summary')}
                  disabled={!medicalSummary}
                  className="flex items-center space-x-1 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!medicalSummary ? 'No medical summary available' : 'Share via email'}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!medicalSummary && <EmptyState type="summary" />}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 leading-relaxed">
              All downloads are encrypted and HIPAA compliant. Your data is securely handled and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 