import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LabReport {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  report_type: string;
  remarks: string;
  file_path: string | null;
  tags: any;
  created_at: string;
}

const LabReports = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
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

      // Fetch lab reports for this patient
      const { data: reportsData, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Fetch doctor names separately
      const doctorIds = [...new Set(reportsData?.map(r => r.doctor_id) || [])];
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name')
        .in('id', doctorIds);

      const doctorMap = new Map(doctorsData?.map(d => [d.id, d.name]) || []);
      
      const reportsWithDoctorNames = reportsData?.map(r => ({
        ...r,
        doctor_name: doctorMap.get(r.doctor_id) || 'Unknown Doctor'
      })) || [];
      
      setReports(reportsWithDoctorNames);
    } catch (error) {
      console.error('Error fetching lab reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lab reports",
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

  const handleDownload = async (filePath: string | null, reportType: string) => {
    if (!filePath) {
      toast({
        title: "No File",
        description: "This report doesn't have an attached file",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('medical-files')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab_report_${reportType.replace(/\s+/g, '_')}.pdf`;
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

  const getUrgencyBadge = (tags: any) => {
    const isUrgent = tags?.urgent;
    return (
      <Badge variant={isUrgent ? "destructive" : "secondary"}>
        {isUrgent ? "Urgent" : "Normal"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Lab Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading lab reports...</div>
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
          Lab Reports ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No lab reports found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(report.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{report.report_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{report.remarks}</div>
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(report.tags)}
                    </TableCell>
                    <TableCell>
                      {report.file_path && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(report.file_path, report.report_type)}>
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

export default LabReports;