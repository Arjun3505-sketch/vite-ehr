import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Settings, FileText, Save } from "lucide-react";
import Diagnoses from "@/components/data/Diagnoses";
import LabReports from "@/components/data/LabReports";
import Prescriptions from "@/components/data/Prescriptions";
import Surgeries from "@/components/data/Surgeries";
import MedicalHistory from "@/components/data/MedicalHistory";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PatientProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [patientId, setPatientId] = useState("");
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      if (!user) return;

      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }

      if (patient) {
        setPatientId(patient.id);
        const nameParts = patient.name?.split(' ') || ['', ''];
        const emergencyContact = patient.emergency_contact as { name?: string; phone?: string } | null;
        setPersonalInfo({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(' ') || "",
          email: patient.email || "",
          phone: patient.phone || "",
          dateOfBirth: patient.dob || "",
          address: patient.address || "",
          emergencyContact: emergencyContact?.name && emergencyContact?.phone 
            ? `${emergencyContact.name} - ${emergencyContact.phone}` 
            : "",
          bloodGroup: patient.blood_group || "",
        });
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      if (!user || !patientId) return;

      const emergencyContactParts = personalInfo.emergencyContact.split(' - ');
      const emergencyContactObj = emergencyContactParts.length === 2 
        ? { name: emergencyContactParts[0], phone: emergencyContactParts[1] }
        : null;

      const { error } = await supabase
        .from('patients')
        .update({
          name: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
          email: personalInfo.email,
          phone: personalInfo.phone,
          dob: personalInfo.dateOfBirth,
          address: personalInfo.address,
          emergency_contact: emergencyContactObj,
          blood_group: personalInfo.bloodGroup,
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/patient-dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-neutral-300">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Health Records
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-neutral-200">First Name</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-neutral-200">Last Name</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-neutral-200">Phone</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-neutral-200">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup" className="text-neutral-200">Blood Group</Label>
                  <Input
                    id="bloodGroup"
                    value={personalInfo.bloodGroup}
                    onChange={(e) => setPersonalInfo({...personalInfo, bloodGroup: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-neutral-200">Address</Label>
                  <Input
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergencyContact" className="text-neutral-200">Emergency Contact (Name - Phone)</Label>
                  <Input
                    id="emergencyContact"
                    value={personalInfo.emergencyContact}
                    onChange={(e) => setPersonalInfo({...personalInfo, emergencyContact: e.target.value})}
                    placeholder="John Doe - 1234567890"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <Button onClick={handleSavePersonalInfo} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Personal Information
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
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
              <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Records */}
        <TabsContent value="records" className="space-y-6">
          <Tabs defaultValue="diagnoses" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
              <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="surgeries">Surgeries</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
            </TabsList>
            <TabsContent value="diagnoses">
              <Diagnoses />
            </TabsContent>
            <TabsContent value="lab-reports">
              <LabReports />
            </TabsContent>
            <TabsContent value="prescriptions">
              <Prescriptions />
            </TabsContent>
            <TabsContent value="surgeries">
              <Surgeries />
            </TabsContent>
            <TabsContent value="medical-history">
              <MedicalHistory patientId={patientId} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProfile;
