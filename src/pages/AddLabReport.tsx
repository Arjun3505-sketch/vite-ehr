import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImageUploader } from "@/components/ocr/ImageUploader";

const AddLabReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    testType: "",
    remarks: "",
    tags: "",
    filePath: "" as string
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const testTypes = [
    "Blood Test - CBC",
    "Blood Test - Lipid Panel",
    "Blood Test - Glucose",
    "Urine Test",
    "X-Ray",
    "CT Scan",
    "MRI",
    "ECG",
    "Ultrasound",
    "Biopsy",
    "Other"
  ];

  // Handle AI-extracted data from Gemini
  const handleDataExtracted = (extractedData: any, file?: File) => {
    console.log("AI Extracted Data:", extractedData);
    console.log("Selected File:", file?.name);

    // Store the file for later upload
    if (file) {
      setSelectedFile(file);
    }

    setFormData(prev => ({
      ...prev,
      testType: extractedData.testType || prev.testType,
      remarks: extractedData.remarks || prev.remarks,
      patientId: extractedData.patientId || prev.patientId,
      date: extractedData.date || prev.date,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a lab report.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get doctor record from doctors table using user_id
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        throw new Error("Doctor profile not found. Please complete your profile setup.");
      }

      // Upload file if selected
      let uploadedFilePath: string | null = null;
      if (selectedFile) {
        console.log('Starting file upload:', selectedFile.name);
        console.log('File size:', selectedFile.size, 'bytes');
        console.log('File type:', selectedFile.type);
        
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `lab-reports/${formData.patientId}/${fileName}`;
        
        console.log('Uploading to path:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('medical-files')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
        
        console.log('File uploaded successfully:', uploadData);
        uploadedFilePath = filePath;
      }

      // Insert lab report with correct doctor_id
      const { error } = await supabase
        .from('lab_reports')
        .insert({
          patient_id: formData.patientId,
          doctor_id: doctorData.id,
          date: formData.date,
          report_type: formData.testType,
          remarks: formData.remarks,
          tags: formData.tags ? { tags: formData.tags.split(',').map(t => t.trim()) } : null,
          file_path: uploadedFilePath
        });

      if (error) throw error;

      toast({
        title: "Lab Report Added",
        description: "The lab report has been successfully uploaded and saved.",
      });
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload lab report.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/doctor-dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Add Lab Report</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Lab Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Document Scanner */}
              <ImageUploader 
                onDataExtracted={handleDataExtracted}
                label="Gemini AI Scanner - Auto-fill from Lab Report"
                promptType="lab-report"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    placeholder="Enter patient ID"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Test Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, testType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g., CBC, Routine, Follow-up"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks & Observations</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter test results, observations, or additional notes..."
                  className="min-h-[120px]"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>

              {/* File Upload Status Indicator */}
              {selectedFile && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    📎 File ready to upload: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This file will be uploaded to Supabase when you click "Upload & Save Report"
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? "Uploading..." : selectedFile ? "Upload File & Save Report" : "Save Report"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/doctor-dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLabReport;