import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, Calendar, FileText, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChatbotButton } from "@/components/chat/ChatbotButton";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!user) return;

      // First, fetch the current doctor record for this user
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) {
        console.error('Error fetching doctor:', doctorError);
        throw doctorError;
      }

      if (!doctor) {
        console.error('No doctor record found for user');
        toast({
          title: "Error",
          description: "Doctor profile not found. Please complete your profile setup.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setDoctorData(doctor);

      // Fetch recent patients (all patients for now, could be filtered by doctor's patients)
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent diagnoses by this doctor
      const { data: diagnosesData } = await supabase
        .from('diagnoses')
        .select('*, patients(name)')
        .eq('doctor_id', doctor.id)
        .order('date', { ascending: false })
        .limit(5);

      // Fetch recent prescriptions by this doctor
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*, patients(name)')
        .eq('doctor_id', doctor.id)
        .order('issue_date', { ascending: false })
        .limit(5);

      setRecentPatients(patientsData || []);
      setRecentDiagnoses(diagnosesData || []);
      setRecentPrescriptions(prescriptionsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Doctor Dashboard</h1>
          <p className="text-neutral-300">
            Welcome back, {doctorData ? `Dr. ${doctorData.name}` : 'Doctor'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/doctor-profile")}>
            Profile
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Button 
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/find-patient")}
        >
          <Users className="w-6 h-6" />
          Find Patient
        </Button>
        <Button 
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/add-diagnosis")}
        >
          <Plus className="w-6 h-6" />
          Add Diagnosis
        </Button>
        <Button 
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/add-prescription")}
        >
          <FileText className="w-6 h-6" />
          New Prescription
        </Button>
        <Button 
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/add-lab-report")}
        >
          <Stethoscope className="w-6 h-6" />
          Add Lab Report
        </Button>
        <Button 
          className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/add-surgery")}
        >
          <Plus className="w-6 h-6" />
          Add Surgery
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Recent Patients ({recentPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-neutral-400">Loading...</div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-4 text-neutral-400">No patients found</div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex justify-between items-center p-3 border border-slate-600 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="font-medium text-white">{patient.name}</p>
                      <p className="text-sm text-neutral-400">{patient.blood_group}</p>
                    </div>
                    <p className="text-sm text-neutral-400">{formatDate(patient.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Diagnoses */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Stethoscope className="w-5 h-5" />
              Recent Diagnoses ({recentDiagnoses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-neutral-400">Loading...</div>
            ) : recentDiagnoses.length === 0 ? (
              <div className="text-center py-4 text-neutral-400">No diagnoses found</div>
            ) : (
              <div className="space-y-3">
                {recentDiagnoses.map((diagnosis) => (
                  <div key={diagnosis.id} className="flex justify-between items-center p-3 border border-slate-600 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="font-medium text-white">{diagnosis.condition}</p>
                      <p className="text-sm text-neutral-400">{diagnosis.patients?.name}</p>
                    </div>
                    <Badge variant={diagnosis.severity === 'severe' ? 'destructive' : 'secondary'}>
                      {diagnosis.severity || 'Normal'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              Recent Prescriptions ({recentPrescriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-neutral-400">Loading...</div>
            ) : recentPrescriptions.length === 0 ? (
              <div className="text-center py-4 text-neutral-400">No prescriptions found</div>
            ) : (
              <div className="space-y-3">
                {recentPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex justify-between items-center p-3 border border-slate-600 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="font-medium text-white">{prescription.patients?.name}</p>
                      <p className="text-sm text-neutral-400">
                        {prescription.instructions ? prescription.instructions.substring(0, 30) + '...' : 'No instructions'}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-400">{formatDate(prescription.issue_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Chatbot Button */}
      <ChatbotButton />
    </div>
  );
};

export default DoctorDashboard;