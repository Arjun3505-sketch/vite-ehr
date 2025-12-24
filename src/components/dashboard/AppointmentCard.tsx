import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/ehr';
import { Badge } from '@/components/ui/badge';

interface AppointmentCardProps {
  appointment: Appointment;
}

const statusStyles = {
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  'in-progress': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeLabels = {
  checkup: 'Check-up',
  'follow-up': 'Follow-up',
  consultation: 'Consultation',
  emergency: 'Emergency',
  procedure: 'Procedure',
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
        <User className="h-6 w-6 text-secondary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{appointment.patientName}</p>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{appointment.time}</span>
          <span>•</span>
          <span>{typeLabels[appointment.type]}</span>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={cn('capitalize', statusStyles[appointment.status])}
      >
        {appointment.status}
      </Badge>
    </div>
  );
}
