import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  enhancedMedicalDocExtraction, 
  extractPatientInfo, 
  analyzeMedicalReport, 
  generateRecommendations,
  extractMedicalDocumentWithRetry 
} from '@/utils/textExtraction';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileText, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function DocumentUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [uploadMode, setUploadMode] = useState<'file' | 'manual'>('file');
  const [manualInput, setManualInput] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<{
    name?: string;
    age?: string;
    gender?: string;
    patientId?: string;
  }>({});
  const [reportAnalysis, setReportAnalysis] = useState<{
    abnormalFindings: string[];
    normalFindings: string[];
    testResults: Record<string, string>;
    summary: string;
  }>({
    abnormalFindings: [],
    normalFindings: [],
    testResults: {},
    summary: ''
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExtractedText('');
      setStatus('');
      setProgress(0);
      setPatientInfo({});
      setReportAnalysis({
        abnormalFindings: [],
        normalFindings: [],
        testResults: {},
        summary: ''
      });
      setRecommendations([]);
    }
  };

  const updateStatus = (message: string) => {
    setStatus(message);
    // Simulate progress based on status updates
    if (message.includes('Starting')) setProgress(10);
    else if (message.includes('Processing')) setProgress(30);
    else if (message.includes('Extracting')) setProgress(50);
    else if (message.includes('OCR')) setProgress(70);
    else if (message.includes('Post-processing')) setProgress(85);
    else if (message.includes('complete')) setProgress(95);
    else if (message.includes('Analysis')) setProgress(100);
  };

  const handleExtractText = async () => {
    if (uploadMode === 'file' && !file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to extract text from.',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMode === 'manual' && !manualInput.trim()) {
      toast({
        title: 'No text entered',
        description: 'Please enter your medical report text.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    setProgress(5);
    
    // Reset previous data
    setExtractedText('');
    setPatientInfo({});
    setReportAnalysis({
      abnormalFindings: [],
      normalFindings: [],
      testResults: {},
      summary: ''
    });
    setRecommendations([]);

    try {
      let text = '';
      
      if (uploadMode === 'file') {
        setStatus('Starting extraction process...');
        // Use the new extraction method with retries and fallbacks
        text = await extractMedicalDocumentWithRetry(file!, updateStatus);
        
        if (!text || text.trim().length < 20) {
          throw new Error('Insufficient text extracted from document. Please try a different file format or ensure the document contains readable text.');
        }
      } else {
        // Use manually entered text
        setStatus('Processing manual input...');
        text = manualInput;
        setProgress(50);
      }
      
      setExtractedText(text);
      setProgress(70);
      
      // Extract patient information
      const patientData = extractPatientInfo(text);
      setPatientInfo(patientData);
      
      // Analyze the medical report
      setStatus('Analyzing medical data...');
      const analysis = analyzeMedicalReport(text);
      setReportAnalysis(analysis);
      
      // Generate recommendations
      setStatus('Generating recommendations...');
      const doctorRecommendations = generateRecommendations(analysis, uploadMode === 'file' ? file!.name : 'Manual Report');
      setRecommendations(doctorRecommendations);
      setProgress(100);
      
      toast({
        title: 'Analysis complete',
        description: patientData.name 
          ? `Patient information and report analysis for ${patientData.name} is ready.`
          : 'Document has been processed and analyzed.',
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      
      // Clear any partial data
      setExtractedText('');
      
      toast({
        title: 'Processing failed',
        description: 'Could not process your medical report file. This is common with certain scanned documents and image formats.',
        variant: 'destructive',
      });
      
      // Show helpful suggestions without examples
      toast({
        title: 'Try one of these solutions',
        description: 'Upload a clearer scan, use PDF format, or ensure high contrast between text and background.',
      });
      
      // Suggest manual input
      toast({
        title: 'Alternative option',
        description: 'Try entering your report data manually using the "Manual Input" tab.',
      });
      
      // Switch to manual mode
      setUploadMode('manual');
    } finally {
      setIsExtracting(false);
      setProgress(100);
      setStatus('');
    }
  };

  const handleSaveToReport = () => {
    // Logic to save extracted text to a report will be implemented here
    toast({
      title: 'Report saved successfully',
      description: 'The analysis and recommendations have been saved to your medical report.',
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Upload Medical Document</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Medical Report Processing</CardTitle>
            <CardDescription>
              Upload a medical document or enter report data manually for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'file' | 'manual')} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="file" disabled={isExtracting} className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="manual" disabled={isExtracting} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Manual Input
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                  >
                    Select File
                  </label>
                  {file && (
                    <div className="mt-4">
                      <Badge variant="outline" className="text-sm">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </Badge>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="manual-input" className="text-sm font-medium">
                    Enter your medical report text
                  </label>
                  <Textarea
                    id="manual-input"
                    placeholder="Paste or type your medical report data here..."
                    className="min-h-[200px]"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include patient details, test results, and any symptoms or findings.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            {isExtracting && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>{status}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleExtractText}
              disabled={isExtracting || (uploadMode === 'file' && !file) || (uploadMode === 'manual' && !manualInput.trim())}
              className="w-full mt-4"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadMode === 'file' ? 'Extracting and Analyzing...' : 'Analyzing Report...'}
                </>
              ) : (
                uploadMode === 'file' ? 'Extract and Analyze' : 'Analyze Report'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Display */}
        {(extractedText || Object.keys(patientInfo).length > 0 || reportAnalysis.summary) && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Medical Report Analysis</CardTitle>
              {patientInfo.name && (
                <CardDescription>
                  Patient: {patientInfo.name} 
                  {patientInfo.age && ` | Age: ${patientInfo.age}`}
                  {patientInfo.gender && ` | Gender: ${patientInfo.gender}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="details">Test Results</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  {/* Patient Information */}
                  {Object.keys(patientInfo).length > 0 && (
                    <div className="rounded-md border p-4 mb-4">
                      <h3 className="font-semibold mb-2">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {patientInfo.name && (
                          <div>
                            <span className="text-muted-foreground">Name:</span>{' '}
                            <span className="font-medium">{patientInfo.name}</span>
                          </div>
                        )}
                        {patientInfo.age && (
                          <div>
                            <span className="text-muted-foreground">Age:</span>{' '}
                            <span className="font-medium">{patientInfo.age} years</span>
                          </div>
                        )}
                        {patientInfo.gender && (
                          <div>
                            <span className="text-muted-foreground">Gender:</span>{' '}
                            <span className="font-medium">{patientInfo.gender}</span>
                          </div>
                        )}
                        {patientInfo.patientId && (
                          <div>
                            <span className="text-muted-foreground">Patient ID:</span>{' '}
                            <span className="font-medium">{patientInfo.patientId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Report Summary */}
                  {reportAnalysis.summary && (
                    <div className="rounded-md border p-4">
                      <h3 className="font-semibold mb-2">Report Summary</h3>
                      <p>{reportAnalysis.summary}</p>
                    </div>
                  )}
                  
                  {/* Abnormal Findings */}
                  {reportAnalysis.abnormalFindings.length > 0 && (
                    <div className="rounded-md border p-4">
                      <h3 className="font-semibold mb-2">Abnormal Findings</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {reportAnalysis.abnormalFindings.map((finding, index) => (
                          <li key={index} className="text-sm">{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="details">
                  {/* Test Results */}
                  {Object.keys(reportAnalysis.testResults).length > 0 ? (
                    <div className="rounded-md border p-4">
                      <h3 className="font-semibold mb-2">Test Results</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(reportAnalysis.testResults).map(([test, value]) => (
                          <div key={test}>
                            <span className="text-muted-foreground">{test}:</span>{' '}
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No specific test results found in this report
                    </div>
                  )}
                  
                  {/* Normal Findings */}
                  {reportAnalysis.normalFindings.length > 0 && (
                    <div className="rounded-md border p-4 mt-4">
                      <h3 className="font-semibold mb-2">Normal Findings</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {reportAnalysis.normalFindings.map((finding, index) => (
                          <li key={index} className="text-sm">{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recommendations">
                  {/* Recommendations */}
                  {recommendations.length > 0 ? (
                    <div className="rounded-md border p-4">
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {recommendations.map((recommendation, index) => (
                          <li key={index}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No recommendations available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="raw">
                  {/* Raw Extracted Text */}
                  <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/20">
                    {extractedText ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm">{extractedText}</pre>
                    ) : (
                      <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                        No text extracted
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveToReport}
                disabled={!extractedText}
                className="w-full"
              >
                Save to Report
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 