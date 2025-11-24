import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImageUploader } from "@/components/ocr/ImageUploader";

const AddSurgery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    procedure: "",
    outcome: "",
    complications: "",
    icdPcsCode: "",
    remarks: "",
    filePath: "" as string
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle AI-extracted data from Gemini
  const handleDataExtracted = (extractedData: any, file?: File) => {
    console.log("🔍 AI Extracted Data:", extractedData);
    console.log("📄 Selected File:", file?.name);
    console.log("📋 Expected fields: patientId, date, procedure, outcome, complications, icdPcsCode, remarks");
    console.log("✅ Extracted fields:", Object.keys(extractedData));

    // Store the file for later upload
    if (file) {
      setSelectedFile(file);
    }

    setFormData(prev => ({
      ...prev,
      patientId: extractedData.patientId || prev.patientId,
      date: extractedData.date || prev.date,
      procedure: extractedData.procedure || prev.procedure,
      outcome: extractedData.outcome || prev.outcome,
      complications: extractedData.complications || prev.complications,
      icdPcsCode: extractedData.icdPcsCode || prev.icdPcsCode,
      remarks: extractedData.remarks || prev.remarks,
    }));
    
    console.log("💾 Form updated with extracted data");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a surgery.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.patientId || !formData.procedure || !formData.outcome) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
        const filePath = `surgeries/${formData.patientId}/${fileName}`;
        
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

      // Insert surgery with correct doctor_id (surgeon_id)
      const { error } = await supabase
        .from('surgeries')
        .insert({
          patient_id: formData.patientId,
          surgeon_id: doctorData.id,
          date: formData.date,
          procedure: formData.procedure,
          outcome: formData.outcome,
          complications: formData.complications || null,
          icd_pcs_code: formData.icdPcsCode || null,
          remarks: formData.remarks || null,
          file_url: uploadedFilePath
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Surgery record added successfully.",
      });

      navigate("/doctor-dashboard");
    } catch (error: any) {
      console.error('Error adding surgery:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add surgery record.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/doctor-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Add Surgery Record</h1>
            <p className="text-neutral-300">Record a new surgical procedure</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Scissors className="w-5 h-5" />
              Surgery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Document Scanner */}
              <ImageUploader 
                onDataExtracted={handleDataExtracted}
                label="Gemini AI Scanner - Auto-fill from Surgery Report"
                promptType="surgery"
              />

              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patientId" className="text-neutral-200">Patient ID *</Label>
                <Input
                  id="patientId"
                  placeholder="Enter patient ID"
                  value={formData.patientId}
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-neutral-200">Surgery Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Procedure */}
              <div className="space-y-2">
                <Label htmlFor="procedure" className="text-neutral-200">Procedure *</Label>
                <Input
                  id="procedure"
                  placeholder="e.g., Appendectomy, Coronary Artery Bypass"
                  value={formData.procedure}
                  onChange={(e) => setFormData({...formData, procedure: e.target.value})}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label htmlFor="outcome" className="text-neutral-200">Outcome *</Label>
                <Input
                  id="outcome"
                  placeholder="e.g., Successful, Complication, Failed"
                  value={formData.outcome}
                  onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Complications */}
              <div className="space-y-2">
                <Label htmlFor="complications" className="text-neutral-200">Complications</Label>
                <Textarea
                  id="complications"
                  placeholder="Describe any complications that occurred during or after surgery"
                  value={formData.complications}
                  onChange={(e) => setFormData({...formData, complications: e.target.value})}
                  rows={3}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* ICD-PCS Code */}
              <div className="space-y-2">
                <Label htmlFor="icdPcsCode" className="text-neutral-200">ICD-PCS Code</Label>
                <Input
                  id="icdPcsCode"
                  placeholder="e.g., 0DTJ4ZZ"
                  value={formData.icdPcsCode}
                  onChange={(e) => setFormData({...formData, icdPcsCode: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-neutral-200">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes about the surgery"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows={4}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              {/* File Upload Status Indicator */}
              {selectedFile && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    📎 File ready to upload: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This file will be uploaded to Supabase when you click "Add Surgery Record"
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Adding Surgery..." : selectedFile ? "Add Surgery & Upload File" : "Add Surgery Record"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/doctor-dashboard")}
                >
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

export default AddSurgery;
