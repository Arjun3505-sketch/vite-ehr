export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      diagnoses: {
        Row: {
          clinical_notes: string | null
          condition: string | null
          created_at: string | null
          date: string
          doctor_id: string
          file_url: string | null
          icd10_code: string | null
          id: string
          patient_id: string
          severity: string | null
          status: string | null
        }
        Insert: {
          clinical_notes?: string | null
          condition?: string | null
          created_at?: string | null
          date: string
          doctor_id: string
          file_url?: string | null
          icd10_code?: string | null
          id?: string
          patient_id: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          clinical_notes?: string | null
          condition?: string | null
          created_at?: string | null
          date?: string
          doctor_id?: string
          file_url?: string | null
          icd10_code?: string | null
          id?: string
          patient_id?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_diagnosis_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_diagnosis_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string | null
          created_at: string | null
          dob: string
          email: string | null
          gender: string | null
          id: string
          license_number: string | null
          name: string
          phone: string | null
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          dob: string
          email?: string | null
          gender?: string | null
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          dob?: string
          email?: string | null
          gender?: string | null
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          created_at: string | null
          date: string
          doctor_id: string
          file_path: string | null
          file_url: string | null
          id: string
          patient_id: string
          remarks: string | null
          report_type: string | null
          tags: Json | null
        }
        Insert: {
          created_at?: string | null
          date: string
          doctor_id: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          patient_id: string
          remarks?: string | null
          report_type?: string | null
          tags?: Json | null
        }
        Update: {
          created_at?: string | null
          date?: string
          doctor_id?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          patient_id?: string
          remarks?: string | null
          report_type?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_report_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_report_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          blood_group: string | null
          created_at: string | null
          dob: string
          email: string | null
          emergency_contact: Json | null
          gender: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          created_at?: string | null
          dob: string
          email?: string | null
          emergency_contact?: Json | null
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          created_at?: string | null
          dob?: string
          email?: string | null
          emergency_contact?: Json | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          dosage: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          medication: string
          prescription_id: string
          quantity: number | null
        }
        Insert: {
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication: string
          prescription_id: string
          quantity?: number | null
        }
        Update: {
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication?: string
          prescription_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescription_item"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          instructions: string | null
          issue_date: string
          patient_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          instructions?: string | null
          issue_date: string
          patient_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          instructions?: string | null
          issue_date?: string
          patient_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescription_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prescription_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          complications: string | null
          created_at: string | null
          date: string
          icd_pcs_code: string | null
          id: string
          outcome: string | null
          patient_id: string
          procedure: string
          remarks: string | null
          surgeon_id: string
        }
        Insert: {
          complications?: string | null
          created_at?: string | null
          date: string
          icd_pcs_code?: string | null
          id?: string
          outcome?: string | null
          patient_id: string
          procedure: string
          remarks?: string | null
          surgeon_id: string
        }
        Update: {
          complications?: string | null
          created_at?: string | null
          date?: string
          icd_pcs_code?: string | null
          id?: string
          outcome?: string | null
          patient_id?: string
          procedure?: string
          remarks?: string | null
          surgeon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_surgery_doctor"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_surgery_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          administered_date: string
          batch_number: string | null
          created_at: string | null
          doctor_id: string
          dose_number: number | null
          id: string
          next_dose_due: string | null
          patient_id: string
          reaction_notes: string | null
          total_doses: number | null
          vaccine_name: string
        }
        Insert: {
          administered_date: string
          batch_number?: string | null
          created_at?: string | null
          doctor_id: string
          dose_number?: number | null
          id?: string
          next_dose_due?: string | null
          patient_id: string
          reaction_notes?: string | null
          total_doses?: number | null
          vaccine_name: string
        }
        Update: {
          administered_date?: string
          batch_number?: string | null
          created_at?: string | null
          doctor_id?: string
          dose_number?: number | null
          id?: string
          next_dose_due?: string | null
          patient_id?: string
          reaction_notes?: string | null
          total_doses?: number | null
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vaccination_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vaccination_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["doctor", "patient"],
    },
  },
} as const
