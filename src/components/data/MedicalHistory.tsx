import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, User, Download, Stethoscope, Pill, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecord {
  id: string;
  type: 'diagnosis' | 'lab_report' | 'prescription' | 'surgery';
  date: string;
  doctor_name: string;
  title: string;
  details: string;
  file_url?: string | null;
}

interface MedicalHistoryProps {
  patientId?: string;
}

const MedicalHistory = ({ patientId }: MedicalHistoryProps = {}) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      let targetPatientId = patientId;

      // If no patientId prop provided, get it from current user
      if (!targetPatientId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (patientError) throw patientError;
        if (!patientData) throw new Error('Patient profile not found');

        targetPatientId = patientData.id;
      }

      // Fetch all medical records for this patient in parallel
      const [diagnosesRes, labReportsRes, prescriptionsRes, surgeriesRes, doctorsRes] = await Promise.all([
        supabase.from('diagnoses').select('*').eq('patient_id', targetPatientId).order('date', { ascending: false }),
        supabase.from('lab_reports').select('*').eq('patient_id', targetPatientId).order('date', { ascending: false }),
        supabase.from('prescriptions').select('*').eq('patient_id', targetPatientId).order('issue_date', { ascending: false }),
        supabase.from('surgeries').select('*').eq('patient_id', targetPatientId).order('date', { ascending: false }),
        supabase.from('doctors').select('id, name'),
      ]);

      const doctorMap = new Map(doctorsRes.data?.map(d => [d.id, d.name]) || []);

      const allRecords: MedicalRecord[] = [];

      // Process diagnoses
      if (diagnosesRes.data) {
        diagnosesRes.data.forEach((d: any) => {
          allRecords.push({
            id: d.id,
            type: 'diagnosis',
            date: d.date,
            doctor_name: doctorMap.get(d.doctor_id) || 'Unknown Doctor',
            title: d.condition,
            details: d.clinical_notes || 'No notes',
            file_url: d.file_url,
          });
        });
      }

      // Process lab reports
      if (labReportsRes.data) {
        labReportsRes.data.forEach((r: any) => {
          allRecords.push({
            id: r.id,
            type: 'lab_report',
            date: r.date,
            doctor_name: doctorMap.get(r.doctor_id) || 'Unknown Doctor',
            title: r.report_type,
            details: r.remarks || 'No remarks',
            file_url: r.file_path,
          });
        });
      }

      // Process prescriptions
      if (prescriptionsRes.data) {
        prescriptionsRes.data.forEach((p: any) => {
          allRecords.push({
            id: p.id,
            type: 'prescription',
            date: p.issue_date,
            doctor_name: doctorMap.get(p.doctor_id) || 'Unknown Doctor',
            title: 'Prescription',
            details: p.instructions || 'No instructions',
          });
        });
      }

      // Process surgeries
      if (surgeriesRes.data) {
        surgeriesRes.data.forEach((s: any) => {
          allRecords.push({
            id: s.id,
            type: 'surgery',
            date: s.date,
            doctor_name: doctorMap.get(s.surgeon_id) || 'Unknown Doctor',
            title: s.procedure,
            details: `Outcome: ${s.outcome}${s.complications ? `, Complications: ${s.complications}` : ''}`,
          });
        });
      }

      // Sort all records by date (newest first)
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(allRecords);
    } catch (error) {
      console.error('Error fetching medical history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medical history",
        variant: "destructive",
      });
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return <Stethoscope className="w-4 h-4" />;
      case 'lab_report':
        return <FileText className="w-4 h-4" />;
      case 'prescription':
        return <Pill className="w-4 h-4" />;
      case 'surgery':
        return <Scissors className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      diagnosis: 'default',
      lab_report: 'secondary',
      prescription: 'outline',
      surgery: 'destructive',
    };

    const labels: Record<string, string> = {
      diagnosis: 'Diagnosis',
      lab_report: 'Lab Report',
      prescription: 'Prescription',
      surgery: 'Surgery',
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {getTypeIcon(type)}
        <span className="ml-1">{labels[type]}</span>
      </Badge>
    );
  };

  const handleDownload = async (fileUrl: string | null | undefined, title: string) => {
    if (!fileUrl) {
      toast({
        title: "No File",
        description: "This record doesn't have an attached file",
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
      a.download = `${title}_${new Date().getTime()}.pdf`;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Complete Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading medical history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Complete Medical History ({records.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No medical records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={`${record.type}-${record.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(record.date)}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {record.doctor_name}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{record.title}</TableCell>
                    <TableCell className="max-w-md truncate">{record.details}</TableCell>
                    <TableCell>
                      {record.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(record.file_url, record.title)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
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

export default MedicalHistory;
