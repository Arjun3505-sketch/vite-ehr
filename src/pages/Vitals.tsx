import { Activity, Heart, Thermometer, Wind } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockVitalSigns, mockPatients } from '@/data/mockData';

const Vitals = () => {
  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  return (
    <MainLayout 
      title="Vital Signs" 
      subtitle="Patient vital sign records"
    >
      <div className="space-y-6">
        {mockVitalSigns.map((vitals, index) => (
          <div 
            key={vitals.id} 
            className="rounded-xl bg-card p-6 shadow-card animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-semibold text-foreground">{getPatientName(vitals.patientId)}</h3>
                <p className="text-sm text-muted-foreground">
                  Recorded: {new Date(vitals.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 rounded-lg bg-secondary p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-xl font-bold">{vitals.bloodPressure}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-secondary p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Heart className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-xl font-bold">{vitals.heartRate} <span className="text-sm font-normal">bpm</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-secondary p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Thermometer className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-xl font-bold">{vitals.temperature}°F</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-secondary p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Wind className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">O2 Saturation</p>
                  <p className="text-xl font-bold">{vitals.oxygenSaturation}%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Respiratory Rate</p>
                <p className="font-semibold">{vitals.respiratoryRate} breaths/min</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="font-semibold">{vitals.weight} lbs</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="font-semibold">{vitals.height} inches</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default Vitals;
