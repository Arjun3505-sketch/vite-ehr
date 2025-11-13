import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import FindPatient from "./pages/FindPatient";
import AddDiagnosis from "./pages/AddDiagnosis";
import AddPrescription from "./pages/AddPrescription";
import AddLabReport from "./pages/AddLabReport";
import AddSurgery from "./pages/AddSurgery";
import PatientProfileSetup from "./pages/PatientProfileSetup";
import DoctorProfileSetup from "./pages/DoctorProfileSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/patient-profile-setup" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientProfileSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor-profile-setup" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorProfileSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor-profile" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient-dashboard" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient-profile" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/find-patient" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <FindPatient />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-diagnosis" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <AddDiagnosis />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-prescription" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <AddPrescription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-lab-report" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <AddLabReport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-surgery" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <AddSurgery />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
