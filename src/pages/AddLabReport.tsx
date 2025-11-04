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

const AddLabReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    testType: "",
    remarks: "",
    tags: "",
    file: null as File | null
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients list.",
        variant: "destructive"
      });
      return;
    }
    
    setPatients(data || []);
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, JPG, or PNG file.",
          variant: "destructive"
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setFormData({...formData, file});
    }
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

    if (!formData.file) {
      toast({
        title: "Error",
        description: "Please upload a lab report file.",
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

      // Upload file with patient_id-based folder structure
      const fileExt = formData.file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = formData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `lab-reports/${formData.patientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

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
          file_path: filePath,
          file_url: filePath
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select onValueChange={(value) => setFormData({...formData, patientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload Report File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:text-primary/80">
                          Click to upload
                        </span>
                        <span className="text-sm text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        PDF, PNG, JPG up to 10MB
                      </p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                  {formData.file && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">{formData.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? "Uploading..." : "Upload & Save Report"}
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