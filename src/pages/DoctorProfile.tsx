import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Bell, 
  Settings, 
  Shield, 
  Palette,
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [doctorInfo, setDoctorInfo] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    experience: "",
    hospital: "",
    department: "",
    bio: ""
  });

  useEffect(() => {
    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    try {
      if (!user) return;

      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching doctor:', error);
        throw error;
      }

      if (doctor) {
        setDoctorInfo({
          name: doctor.name || "",
          email: doctor.email || "",
          phone: doctor.phone || "",
          specialization: doctor.specialization || "",
          licenseNumber: doctor.license_number || "",
          experience: "", // Not in DB schema
          hospital: "", // Not in DB schema
          department: "", // Not in DB schema
          bio: "" // Not in DB schema
        });
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    appointmentReminders: true,
    labResults: true,
    emergencyAlerts: true
  });

  const [practiceSettings, setPracticeSettings] = useState({
    consultationDuration: "30",
    workingHours: "9:00 AM - 5:00 PM",
    breakTime: "12:00 PM - 1:00 PM",
    weekends: false,
    emergencyAvailable: true
  });

  const fetchMyPatients = async () => {
    try {
      setLoadingPatients(true);
      if (!user) return;

      // Get doctor record
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        throw new Error("Doctor profile not found");
      }

      // Get all unique patient IDs from diagnoses, prescriptions, surgeries, and lab reports
      const [diagnosesRes, prescriptionsRes, surgeriesRes, labReportsRes] = await Promise.all([
        supabase.from('diagnoses').select('patient_id').eq('doctor_id', doctorData.id),
        supabase.from('prescriptions').select('patient_id').eq('doctor_id', doctorData.id),
        supabase.from('surgeries').select('patient_id').eq('surgeon_id', doctorData.id),
        supabase.from('lab_reports').select('patient_id').eq('doctor_id', doctorData.id)
      ]);

      const patientIds = new Set([
        ...(diagnosesRes.data?.map(d => d.patient_id) || []),
        ...(prescriptionsRes.data?.map(p => p.patient_id) || []),
        ...(surgeriesRes.data?.map(s => s.patient_id) || []),
        ...(labReportsRes.data?.map(l => l.patient_id) || [])
      ]);

      if (patientIds.size === 0) {
        setPatients([]);
        return;
      }

      // Fetch patient details
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .in('id', Array.from(patientIds));

      if (patientsError) throw patientsError;

      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSaveProfessionalInfo = async () => {
    try {
      if (!user) return;

      const { data: doctor, error: fetchError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('doctors')
        .update({
          name: doctorInfo.name,
          email: doctorInfo.email,
          phone: doctorInfo.phone,
          specialization: doctorInfo.specialization,
          license_number: doctorInfo.licenseNumber,
        })
        .eq('id', doctor.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your professional information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all password fields",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/doctor-dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Doctor Profile</h1>
        </div>

        <Tabs defaultValue="professional" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>

          {/* Professional Information */}
          <TabsContent value="professional">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5" />
                  Edit Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-neutral-200">Full Name</Label>
                    <Input
                      id="name"
                      value={doctorInfo.name}
                      onChange={(e) => setDoctorInfo({...doctorInfo, name: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={doctorInfo.email}
                      onChange={(e) => setDoctorInfo({...doctorInfo, email: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-neutral-200">Phone</Label>
                    <Input
                      id="phone"
                      value={doctorInfo.phone}
                      onChange={(e) => setDoctorInfo({...doctorInfo, phone: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-neutral-200">Specialization</Label>
                    <Input
                      id="specialization"
                      value={doctorInfo.specialization}
                      onChange={(e) => setDoctorInfo({...doctorInfo, specialization: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license" className="text-neutral-200">License Number</Label>
                    <Input
                      id="license"
                      value={doctorInfo.licenseNumber}
                      onChange={(e) => setDoctorInfo({...doctorInfo, licenseNumber: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-neutral-200">Experience</Label>
                    <Input
                      id="experience"
                      value={doctorInfo.experience}
                      onChange={(e) => setDoctorInfo({...doctorInfo, experience: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital" className="text-neutral-200">Hospital/Clinic</Label>
                    <Input
                      id="hospital"
                      value={doctorInfo.hospital}
                      onChange={(e) => setDoctorInfo({...doctorInfo, hospital: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-neutral-200">Department</Label>
                    <Input
                      id="department"
                      value={doctorInfo.department}
                      onChange={(e) => setDoctorInfo({...doctorInfo, department: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio" className="text-neutral-200">Bio</Label>
                    <Textarea
                      id="bio"
                      value={doctorInfo.bio}
                      onChange={(e) => setDoctorInfo({...doctorInfo, bio: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfessionalInfo} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security & Password */}
          <TabsContent value="security">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-neutral-200">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-neutral-200">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-neutral-200">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Patient Management */}
          <TabsContent value="patients">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  My Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300 mb-4">Patients you have treated</p>
                <Button onClick={fetchMyPatients} className="mb-4 bg-blue-600 hover:bg-blue-700" disabled={loadingPatients}>
                  {loadingPatients ? "Loading..." : "Load Patients"}
                </Button>
                
                {patients.length === 0 && !loadingPatients ? (
                  <div className="text-center py-8 text-neutral-400">
                    No patients found. Add diagnoses, prescriptions, surgeries, or lab reports to see patients here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <Card key={patient.id} className="border-slate-600 bg-slate-700/30">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg text-white">{patient.name}</h3>
                              <p className="text-sm text-neutral-400">ID: {patient.id}</p>
                              <p className="text-sm text-neutral-400">Email: {patient.email || 'N/A'}</p>
                              <p className="text-sm text-neutral-400">Phone: {patient.phone || 'N/A'}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/find-patient', { state: { patientId: patient.id } })}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorProfile;