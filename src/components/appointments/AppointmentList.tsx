import { Appointment } from '@/types/ehr';
import { Clock, User, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppointmentListProps {
  appointments: Appointment[];
}

const statusStyles = {
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  'in-progress': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeStyles = {
  checkup: 'bg-accent/10 text-accent',
  'follow-up': 'bg-primary/10 text-primary',
  consultation: 'bg-secondary text-secondary-foreground',
  emergency: 'bg-destructive/10 text-destructive',
  procedure: 'bg-warning/10 text-warning',
};

export function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <div className="space-y-3">
      {appointments.map((appointment, index) => (
        <div
          key={appointment.id}
          className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex flex-col items-center rounded-lg bg-secondary px-4 py-2 text-center">
            <span className="text-2xl font-bold text-foreground">{appointment.time.split(':')[0]}</span>
            <span className="text-xs text-muted-foreground">{appointment.time.split(':')[1]} AM</span>
          </div>
          
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{appointment.patientName}</p>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{appointment.doctor}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{appointment.duration} min</span>
              </div>
            </div>
            {appointment.notes && (
              <p className="mt-1 text-sm text-muted-foreground truncate">{appointment.notes}</p>
            )}
          </div>

          <Badge className={cn('capitalize', typeStyles[appointment.type])}>
            {appointment.type.replace('-', ' ')}
          </Badge>

          <Badge 
            variant="outline" 
            className={cn('capitalize', statusStyles[appointment.status])}
          >
            {appointment.status}
          </Badge>

          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
