import { Users, Calendar, TestTube, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentCard } from '@/components/dashboard/AppointmentCard';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { mockDashboardStats, mockAppointments, mockPatients } from '@/data/mockData';

const Index = () => {
  const todayAppointments = mockAppointments.filter(
    (apt) => apt.date === '2024-12-24'
  );

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Welcome back, Dr. Chen"
    >
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={mockDashboardStats.totalPatients.toLocaleString()}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="Today's Appointments"
          value={mockDashboardStats.todayAppointments}
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Pending Tests"
          value={mockDashboardStats.pendingTests}
          icon={TestTube}
          variant="warning"
        />
        <StatCard
          title="Critical Cases"
          value={mockDashboardStats.criticalCases}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
              <span className="text-sm text-muted-foreground">
                {todayAppointments.length} appointments
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {todayAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div>
          <RecentPatients patients={mockPatients} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
