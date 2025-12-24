export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  insuranceProvider: string;
  insuranceId: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'active' | 'inactive' | 'critical';
  lastVisit: string;
  nextAppointment?: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: 'checkup' | 'follow-up' | 'consultation' | 'emergency' | 'procedure';
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  doctor: string;
  notes?: string;
  duration: number;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  date: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'diagnosis' | 'prescription' | 'lab-result' | 'procedure' | 'note';
  title: string;
  description: string;
  doctor: string;
  attachments?: string[];
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTests: number;
  criticalCases: number;
}
