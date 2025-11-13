import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const AddPrescription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    remarks: "",
    tags: ""
  });

  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a prescription.",
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

      // Insert prescription with correct doctor_id
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: formData.patientId,
          doctor_id: doctorData.id,
          issue_date: formData.startDate,
          valid_until: formData.expiryDate,
          instructions: formData.remarks + (formData.tags ? `\n\nTags: ${formData.tags}` : '')
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Insert prescription items
      const prescriptionItems = medications.map(med => ({
        prescription_id: prescriptionData.id,
        medication: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration_days: parseInt(med.duration) || null,
        instructions: med.instructions
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(prescriptionItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Prescription Created",
        description: "The prescription has been successfully created and saved.",
      });
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save prescription.",
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
          <Button variant="outline" size="icon" onClick={() => navigate("/doctor-dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">New Prescription</h1>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., Pain Relief, Antibiotic"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes or special instructions..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Medications</CardTitle>
                <Button onClick={addMedication} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMedication(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Medication Name</Label>
                        <Input
                          placeholder="e.g., Amoxicillin"
                          value={medication.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input
                          placeholder="e.g., 500mg"
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select onValueChange={(value) => updateMedication(index, "frequency", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once-daily">Once Daily</SelectItem>
                            <SelectItem value="twice-daily">Twice Daily</SelectItem>
                            <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                            <SelectItem value="four-times-daily">Four Times Daily</SelectItem>
                            <SelectItem value="as-needed">As Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g., 7 days"
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, "duration", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Special Instructions</Label>
                        <Input
                          placeholder="e.g., Take with food"
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-4 pt-6">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Prescription"}
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
    </div>
  );
};

export default AddPrescription;