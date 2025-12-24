import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart,
  AlertTriangle,
  FileText,
  Activity
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPatients, mockVitalSigns, mockMedicalRecords } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PatientDetail = () => {
  const { id } = useParams();
  const patient = mockPatients.find((p) => p.id === id);
  const vitals = mockVitalSigns.find((v) => v.patientId === id);
  const records = mockMedicalRecords.filter((r) => r.patientId === id);

  if (!patient) {
    return (
      <MainLayout title="Patient Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found.</p>
          <Button asChild className="mt-4">
            <Link to="/patients">Back to Patients</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <MainLayout 
      title={`${patient.firstName} ${patient.lastName}`}
      subtitle="Patient Profile"
    >
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/patients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {patient.firstName} {patient.lastName}
              </h2>
              <Badge 
                variant="outline" 
                className={cn('mt-2 capitalize', statusStyles[patient.status])}
              >
                {patient.status}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Age:</span>
                <span className="font-medium">{age} years ({patient.dateOfBirth})</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Blood Type:</span>
                <span className="font-medium">{patient.bloodType}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{patient.email}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="font-medium">{patient.address}</span>
              </div>
            </div>

            {patient.allergies.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Allergies</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-medium text-foreground">Emergency Contact</h4>
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{patient.emergencyContact.name}</p>
                <p>{patient.emergencyContact.relationship}</p>
                <p>{patient.emergencyContact.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-secondary">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Conditions */}
              <div className="rounded-xl bg-card p-6 shadow-card">
                <h3 className="font-semibold text-foreground">Active Conditions</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {patient.conditions.length > 0 ? (
                    patient.conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No active conditions</p>
                  )}
                </div>
              </div>

              {/* Insurance */}
              <div className="rounded-xl bg-card p-6 shadow-card">
                <h3 className="font-semibold text-foreground">Insurance Information</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{patient.insuranceProvider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Policy ID</p>
                    <p className="font-medium">{patient.insuranceId}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vitals" className="mt-6">
              {vitals ? (
                <div className="rounded-xl bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Latest Vitals</h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(vitals.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Blood Pressure</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">{vitals.bloodPressure}</p>
                      <p className="text-xs text-muted-foreground">mmHg</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-muted-foreground">Heart Rate</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">{vitals.heartRate}</p>
                      <p className="text-xs text-muted-foreground">bpm</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Temperature</span>
                      <p className="mt-2 text-2xl font-bold">{vitals.temperature}°F</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">O2 Saturation</span>
                      <p className="mt-2 text-2xl font-bold">{vitals.oxygenSaturation}%</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Respiratory Rate</span>
                      <p className="mt-2 text-2xl font-bold">{vitals.respiratoryRate}</p>
                      <p className="text-xs text-muted-foreground">breaths/min</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Weight</span>
                      <p className="mt-2 text-2xl font-bold">{vitals.weight}</p>
                      <p className="text-xs text-muted-foreground">lbs</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-card p-6 shadow-card text-center">
                  <p className="text-muted-foreground">No vital signs recorded</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="records" className="mt-6 space-y-4">
              {records.length > 0 ? (
                records.map((record) => (
                  <div key={record.id} className="rounded-xl bg-card p-6 shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{record.title}</h4>
                          <p className="text-sm text-muted-foreground">{record.doctor}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {record.type.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{record.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-card p-6 shadow-card text-center">
                  <p className="text-muted-foreground">No medical records found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientDetail;
