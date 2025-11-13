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
      const { data: reportsData, error } = await supabase
        .from('lab_reports')
        .select('*')
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
                        <Button variant="outline" size="sm">
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