import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImageUploader } from "@/components/ocr/ImageUploader.tsx";

const AddDiagnosis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    diagnosis: "",
    details: "",
    severity: "",
    filePath: "" as string
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle AI-extracted data from Gemini
  const handleDataExtracted = (extractedData: any, file?: File) => {
    console.log("AI Extracted Data:", extractedData);
    console.log("Selected File:", file?.name);

    // Store the file for later upload
    if (file) {
      setSelectedFile(file);
    }

    // Validate severity field
    const validSeverities = ['mild', 'moderate', 'severe', 'critical'];
    let severity = extractedData.severity?.toLowerCase() || '';
    if (!validSeverities.includes(severity)) {
      severity = ''; // Let user select if invalid
    }

    // Update form state with AI-extracted data
    setFormData(prev => ({
      ...prev,
      diagnosis: extractedData.diagnosis || prev.diagnosis,
      details: extractedData.details || prev.details,
      severity: severity || prev.severity,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a diagnosis.",
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
        const filePath = `diagnoses/${formData.patientId}/${fileName}`;
        
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

      // Insert diagnosis with correct doctor_id
      const { error } = await supabase
        .from('diagnoses')
        .insert({
          patient_id: formData.patientId,
          doctor_id: doctorData.id,
          date: formData.date,
          condition: formData.diagnosis,
          clinical_notes: formData.details,
          severity: formData.severity,
          file_url: uploadedFilePath
        });

      if (error) throw error;

      // Trigger Telegram Notification
      try {
        await axios.post('http://localhost:5000/send-notification', {
          message: `📋 *New Diagnosis Added*\n\n👤 *Patient ID:* ${formData.patientId}\n🩺 *Condition:* ${formData.diagnosis}\n⚠️ *Severity:* ${formData.severity}`
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
        // We don't stop the flow here, just log the error so the UI still updates
      }

      toast({
        title: "Diagnosis Added",
        description: "The diagnosis has been successfully added to the patient's record.",
      });
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save diagnosis.",
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
          <h1 className="text-3xl font-bold text-foreground">Add Diagnosis</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Diagnosis Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Document Scanner */}
              <ImageUploader 
                onDataExtracted={handleDataExtracted}
                label="Gemini AI Scanner - Auto-fill from Medical Document"
                promptType="diagnosis"
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
                  <Label htmlFor="date">Date</Label>
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
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  placeholder="Enter diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select onValueChange={(value) => setFormData({...formData, severity: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Details & Notes</Label>
                <Textarea
                  id="details"
                  placeholder="Enter detailed diagnosis information, symptoms, treatment plan..."
                  className="min-h-[120px]"
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                />
              </div>

              {/* File Upload Status Indicator */}
              {selectedFile && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    📎 File ready to upload: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This file will be uploaded to Supabase when you click "Save Diagnosis"
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : selectedFile ? "Save Diagnosis & Upload File" : "Save Diagnosis"}
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

export default AddDiagnosis;
