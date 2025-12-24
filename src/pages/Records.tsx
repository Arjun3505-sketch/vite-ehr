import { FileText, Search, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockMedicalRecords, mockPatients } from '@/data/mockData';

const typeStyles = {
  diagnosis: 'bg-primary/10 text-primary',
  prescription: 'bg-success/10 text-success',
  'lab-result': 'bg-warning/10 text-warning',
  procedure: 'bg-accent/10 text-accent',
  note: 'bg-secondary text-secondary-foreground',
};

const Records = () => {
  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  return (
    <MainLayout 
      title="Medical Records" 
      subtitle="View and manage patient records"
    >
      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Records List */}
      <div className="mt-6 space-y-4">
        {mockMedicalRecords.map((record, index) => (
          <div 
            key={record.id} 
            className="rounded-xl bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{record.title}</h3>
                    <p className="text-sm text-primary">{getPatientName(record.patientId)}</p>
                  </div>
                  <Badge className={typeStyles[record.type as keyof typeof typeStyles]}>
                    {record.type.replace('-', ' ')}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{record.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{record.doctor}</span>
                  <span>•</span>
                  <span>{new Date(record.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default Records;
