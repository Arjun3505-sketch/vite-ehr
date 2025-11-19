-- Fix storage bucket and RLS policies for medical files
-- This migration ensures the bucket exists and policies are correctly configured

-- Ensure the medical-files bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Doctors can upload medical files" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view all medical files" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete medical files" ON storage.objects;

-- Policy 1: Doctors can upload files (check both user_roles AND doctors table)
CREATE POLICY "Doctors can upload medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files' AND
  (
    has_role(auth.uid(), 'doctor'::app_role) OR
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()
    )
  )
);

-- Policy 2: Doctors can view all medical files
CREATE POLICY "Doctors can view all medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (
    has_role(auth.uid(), 'doctor'::app_role) OR
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()
    )
  )
);

-- Policy 3: Patients can view only their own files
CREATE POLICY "Patients can view their own medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.user_id = auth.uid() AND
    (
      (storage.objects.name LIKE 'diagnoses/' || patients.id::text || '/%') OR
      (storage.objects.name LIKE 'lab-reports/' || patients.id::text || '/%') OR
      (storage.objects.name LIKE 'surgeries/' || patients.id::text || '/%') OR
      (storage.objects.name LIKE 'prescriptions/' || patients.id::text || '/%')
    )
  )
);

-- Policy 4: Doctors can delete files
CREATE POLICY "Doctors can delete medical files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (
    has_role(auth.uid(), 'doctor'::app_role) OR
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()
    )
  )
);

-- Policy 5: Doctors can update files (for overwriting)
CREATE POLICY "Doctors can update medical files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (
    has_role(auth.uid(), 'doctor'::app_role) OR
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()
    )
  )
);
