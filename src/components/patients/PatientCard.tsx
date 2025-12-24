import { Link } from 'react-router-dom';
import { Phone, Mail, Calendar } from 'lucide-react';
import { Patient } from '@/types/ehr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PatientCardProps {
  patient: Patient;
}

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  critical: 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse-subtle',
};

export function PatientCard({ patient }: PatientCardProps) {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return (
    <div className="rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {age} years • {patient.gender} • {patient.bloodType}
            </p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn('capitalize', statusStyles[patient.status])}
        >
          {patient.status}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="truncate">{patient.email}</span>
        </div>
        {patient.nextAppointment && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Calendar className="h-4 w-4" />
            <span>Next: {new Date(patient.nextAppointment).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {patient.conditions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {patient.conditions.slice(0, 2).map((condition, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {condition}
            </Badge>
          ))}
          {patient.conditions.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{patient.conditions.length - 2} more
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link to={`/patients/${patient.id}`}>View Details</Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          Schedule
        </Button>
      </div>
    </div>
  );
}
