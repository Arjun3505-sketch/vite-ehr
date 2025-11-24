import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  specialization: z.string().min(2, "Specialization is required").max(100, "Specialization too long"),
  licenseNumber: z.string().min(2, "License number is required").max(50, "License number too long"),
  address: z.string().max(500, "Address too long").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const DoctorProfileSetup = () => {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    specialization: "",
    licenseNumber: "",
    address: "",
    phone: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validation = profileSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to complete profile setup",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (passwordError) throw passwordError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.name })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert doctor role into user_roles table (CRITICAL for storage permissions)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'doctor' }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error creating doctor role:', roleError);
        throw roleError;
      }

      // Insert into doctors table
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          name: formData.name,
          dob: formData.dob,
          gender: formData.gender || null,
          specialization: formData.specialization,
          license_number: formData.licenseNumber,
          address: formData.address || null,
          phone: formData.phone || null,
        });

      if (doctorError) throw doctorError;

      toast({
        title: "Success",
        description: "Profile setup completed successfully!",
      });

      navigate('/doctor-dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Complete Your Doctor Profile</CardTitle>
          <CardDescription className="text-neutral-300">
            Please provide your professional information and set a new password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-200">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-neutral-200">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-neutral-200">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="e.g., Cardiology"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-neutral-200">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-neutral-200">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={loading}
                placeholder="Enter your address"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-neutral-200">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white">Set New Password</h3>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-neutral-200">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Minimum 6 characters"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-neutral-200">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-neutral-400"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Setting up profile..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfileSetup;
