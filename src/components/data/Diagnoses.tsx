import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Calendar, AlertTriangle, CheckCircle, Clock, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Diagnosis {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  condition: string;
  icd10_code: string | null;
  severity: string | null;
  status: string | null;
  clinical_notes: string | null;
  file_url: string | null;
  created_at: string;
  doctor_name?: string;
}

const Diagnoses = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  const fetchDiagnoses = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get patient record for current user
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError) throw patientError;
      if (!patientData) throw new Error('Patient profile not found');

      // Fetch diagnoses for this patient
      const { data: diagnosesData, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Fetch doctor names separately
      const doctorIds = [...new Set(diagnosesData?.map(d => d.doctor_id) || [])];
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name')
        .in('id', doctorIds);

      const doctorMap = new Map(doctorsData?.map(d => [d.id, d.name]) || []);
      
      const diagnosesWithDoctorNames = diagnosesData?.map(d => ({
        ...d,
        doctor_name: doctorMap.get(d.doctor_id) || 'Unknown Doctor'
      })) || [];
      
      setDiagnoses(diagnosesWithDoctorNames);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch diagnoses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl: string | null, condition: string) => {
    if (!fileUrl) {
      toast({
        title: "No File",
        description: "This diagnosis doesn't have an attached file",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('medical-files')
        .download(fileUrl);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnosis_${condition}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    
    switch (severity.toLowerCase()) {
      case 'mild':
        return <Badge variant="secondary">Mild</Badge>;
      case 'moderate':
        return <Badge variant="default">Moderate</Badge>;
      case 'severe':
        return <Badge variant="destructive">Severe</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case 'confirmed':
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'provisional':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Provisional
          </Badge>
        );
      case 'chronic':
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Chronic
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Diagnoses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading diagnoses...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5" />
          Diagnoses ({diagnoses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {diagnoses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No diagnoses found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>ICD-10</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clinical Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnoses.map((diagnosis) => (
                  <TableRow key={diagnosis.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(diagnosis.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{diagnosis.condition}</div>
                    </TableCell>
                    <TableCell>
                      {diagnosis.icd10_code ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {diagnosis.icd10_code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(diagnosis.severity)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(diagnosis.status)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {diagnosis.clinical_notes || "No notes"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Diagnoses;