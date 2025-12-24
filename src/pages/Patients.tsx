import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientCard } from '@/components/patients/PatientCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockPatients } from '@/data/mockData';

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = mockPatients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="Patients" 
      subtitle={`${mockPatients.length} registered patients`}
    >
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPatients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">No patients found matching your search.</p>
        </div>
      )}
    </MainLayout>
  );
};

export default Patients;
