import { Patient } from '@/types/ehr';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RecentPatientsProps {
  patients: Patient[];
}

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-foreground">Recent Patients</h3>
      <div className="mt-4 space-y-3">
        {patients.slice(0, 5).map((patient, index) => (
          <div
            key={patient.id}
            className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={cn('capitalize', statusStyles[patient.status])}
            >
              {patient.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
