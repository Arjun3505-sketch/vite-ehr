import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { Button } from '@/components/ui/button';
import { mockAppointments } from '@/data/mockData';

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState('2024-12-24');

  const filteredAppointments = mockAppointments
    .filter((apt) => apt.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout 
      title="Appointments" 
      subtitle="Manage patient appointments"
    >
      {/* Date Navigation */}
      <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-card">
        <Button variant="ghost" size="icon">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{formatDate(selectedDate)}</p>
          <p className="text-sm text-muted-foreground">
            {filteredAppointments.length} appointments scheduled
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button variant="gradient">
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Appointments List */}
      <div className="mt-6">
        {filteredAppointments.length > 0 ? (
          <AppointmentList appointments={filteredAppointments} />
        ) : (
          <div className="rounded-xl bg-card p-12 shadow-card text-center">
            <p className="text-muted-foreground">No appointments scheduled for this date</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Appointments;
