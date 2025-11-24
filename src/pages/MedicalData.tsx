import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabReports from "@/components/data/LabReports";
import Surgeries from "@/components/data/Surgeries";
import Prescriptions from "@/components/data/Prescriptions";
import Diagnoses from "@/components/data/Diagnoses";
import Vaccinations from "@/components/data/Vaccinations";

const MedicalData = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Medical Data</h1>
            <p className="text-neutral-300">View all medical records and patient data</p>
          </div>
        </div>

        {/* Medical Data Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reports">Lab Reports</TabsTrigger>
            <TabsTrigger value="surgeries">Surgeries</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
            <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <LabReports />
          </TabsContent>

          <TabsContent value="surgeries">
            <Surgeries />
          </TabsContent>

          <TabsContent value="prescriptions">
            <Prescriptions />
          </TabsContent>

          <TabsContent value="diagnoses">
            <Diagnoses />
          </TabsContent>

          <TabsContent value="vaccinations">
            <Vaccinations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedicalData;