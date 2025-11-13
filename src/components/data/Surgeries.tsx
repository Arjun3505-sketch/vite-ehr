import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scissors, Calendar, AlertTriangle, CheckCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Surgery {
  id: string;
  patient_id: string;
  surgeon_id: string;
  date: string;
  procedure: string;
  outcome: string;
  complications: string | null;
  remarks: string | null;
  icd_pcs_code: string | null;
  created_at: string;
  doctor_name?: string;
}

const Surgeries = () => {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSurgeries();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const { data: surgeriesData, error } = await supabase
        .from('surgeries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Fetch doctor names separately
      const doctorIds = [...new Set(surgeriesData?.map(s => s.surgeon_id) || [])];
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name')
        .in('id', doctorIds);

      const doctorMap = new Map(doctorsData?.map(d => [d.id, d.name]) || []);
      
      const surgeriesWithDoctorNames = surgeriesData?.map(s => ({
        ...s,
        doctor_name: doctorMap.get(s.surgeon_id) || 'Unknown Doctor'
      })) || [];
      
      setSurgeries(surgeriesWithDoctorNames);
    } catch (error) {
      console.error('Error fetching surgeries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch surgeries",
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

  const getOutcomeBadge = (outcome: string) => {
    const isSuccessful = outcome.toLowerCase() === 'successful';
    return (
      <Badge variant={isSuccessful ? "default" : "destructive"}>
        {isSuccessful ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <AlertTriangle className="w-3 h-3 mr-1" />
        )}
        {outcome}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Surgeries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading surgeries...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Surgeries ({surgeries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {surgeries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No surgeries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Complications</TableHead>
                  <TableHead>ICD-PCS Code</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surgeries.map((surgery) => (
                  <TableRow key={surgery.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(surgery.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{surgery.procedure}</div>
                    </TableCell>
                    <TableCell>
                      {getOutcomeBadge(surgery.outcome)}
                    </TableCell>
                    <TableCell>
                      {surgery.complications ? (
                        <div className="text-destructive text-sm">
                          {surgery.complications}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">None</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {surgery.icd_pcs_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {surgery.remarks || "No remarks"}
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

export default Surgeries;