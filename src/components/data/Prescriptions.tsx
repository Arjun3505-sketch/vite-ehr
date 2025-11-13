import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, Calendar, Clock, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  issue_date: string;
  valid_until: string | null;
  instructions: string | null;
  created_at: string;
  doctor_name?: string;
}

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
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

      // Fetch prescriptions for this patient
      const { data: prescriptionsData, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      // Fetch doctor names separately
      const doctorIds = [...new Set(prescriptionsData?.map(p => p.doctor_id) || [])];
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name')
        .in('id', doctorIds);

      const doctorMap = new Map(doctorsData?.map(d => [d.id, d.name]) || []);
      
      const prescriptionsWithDoctorNames = prescriptionsData?.map(p => ({
        ...p,
        doctor_name: doctorMap.get(p.doctor_id) || 'Unknown Doctor'
      })) || [];
      
      setPrescriptions(prescriptionsWithDoctorNames);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions",
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

  const getValidityBadge = (validUntil: string | null) => {
    if (!validUntil) return null;
    
    const validDate = new Date(validUntil);
    const today = new Date();
    const isExpired = validDate < today;
    const isExpiringSoon = validDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Within 7 days

    if (isExpired) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    } else if (isExpiringSoon) {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Expires Soon
        </Badge>
      );
    } else {
      return (
        <Badge variant="default">
          Valid
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading prescriptions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Prescriptions ({prescriptions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No prescriptions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Instructions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(prescription.issue_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {prescription.valid_until ? formatDate(prescription.valid_until) : "No expiry"}
                    </TableCell>
                    <TableCell>
                      {getValidityBadge(prescription.valid_until)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {prescription.instructions || "No specific instructions"}
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

export default Prescriptions;