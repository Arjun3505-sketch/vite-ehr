import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MedicalHistory from "@/components/data/MedicalHistory";

const FindPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);

  const handleSearch = async () => {
    if (!patientId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a patient ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId.trim())
        .single();

      if (error) throw error;

      if (!patient) {
        toast({
          title: "Not Found",
          description: "No patient found with this ID",
          variant: "destructive"
        });
        setPatientData(null);
        return;
      }

      setPatientData(patient);
      toast({
        title: "Success",
        description: "Patient found successfully"
      });
    } catch (error: any) {
      console.error('Error searching patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search for patient",
        variant: "destructive"
      });
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/doctor-dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Find Patient</h1>
          <p className="text-muted-foreground">Search for patients by name, email, or ID</p>
        </div>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details */}
      {patientData && (
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patientData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium font-mono">{patientData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patientData.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patientData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{patientData.dob ? formatDate(patientData.dob) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <Badge variant="outline">{patientData.blood_group || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{patientData.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="font-medium">{formatDate(patientData.created_at)}</p>
                </div>
                {patientData.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patientData.address}</p>
                  </div>
                )}
                {patientData.emergency_contact && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">
                      {patientData.emergency_contact.name} - {patientData.emergency_contact.phone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <MedicalHistory patientId={patientData.id} />
        </div>
      )}
    </div>
  );
};

export default FindPatient;