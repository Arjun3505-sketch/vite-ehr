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
    console.log("AI Extracted Data:", extractedData);
    console.log("Selected File:", file?.name);

    // Store the file for later upload
    if (file) {
      setSelectedFile(file);
    }

    setFormData(prev => ({
      ...prev,
      procedure: extractedData.procedure || prev.procedure,
      outcome: extractedData.outcome || prev.outcome,
      complications: extractedData.complications || prev.complications,
      icdPcsCode: extractedData.icdPcsCode || prev.icdPcsCode,
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
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `surgeries/${formData.patientId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-files')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/doctor-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add Surgery Record</h1>
            <p className="text-muted-foreground">Record a new surgical procedure</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                promptType="diagnosis"
              />

              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  placeholder="Enter patient ID"
                  value={formData.patientId}
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Surgery Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              {/* Procedure */}
              <div className="space-y-2">
                <Label htmlFor="procedure">Procedure *</Label>
                <Input
                  id="procedure"
                  placeholder="e.g., Appendectomy, Coronary Artery Bypass"
                  value={formData.procedure}
                  onChange={(e) => setFormData({...formData, procedure: e.target.value})}
                  required
                />
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome *</Label>
                <Select 
                  value={formData.outcome} 
                  onValueChange={(value) => setFormData({...formData, outcome: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="complication">Complication</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complications */}
              <div className="space-y-2">
                <Label htmlFor="complications">Complications</Label>
                <Textarea
                  id="complications"
                  placeholder="Describe any complications that occurred during or after surgery"
                  value={formData.complications}
                  onChange={(e) => setFormData({...formData, complications: e.target.value})}
                  rows={3}
                />
              </div>

              {/* ICD-PCS Code */}
              <div className="space-y-2">
                <Label htmlFor="icdPcsCode">ICD-PCS Code</Label>
                <Input
                  id="icdPcsCode"
                  placeholder="e.g., 0DTJ4ZZ"
                  value={formData.icdPcsCode}
                  onChange={(e) => setFormData({...formData, icdPcsCode: e.target.value})}
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes about the surgery"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Attach File (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                {formData.file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.file.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Adding Surgery..." : "Add Surgery Record"}
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
