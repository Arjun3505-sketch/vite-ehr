-- Create medical-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- RLS Policy - Doctors can upload files
CREATE POLICY "Doctors can upload medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files' AND
  has_role(auth.uid(), 'doctor'::app_role)
);

-- RLS Policy - Doctors can view all files
CREATE POLICY "Doctors can view all medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  has_role(auth.uid(), 'doctor'::app_role)
);

-- RLS Policy - Patients can view their own files
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
      (storage.objects.name LIKE 'prescriptions/' || patients.id::text || '/%')
    )
  )
);

-- RLS Policy - Doctors can delete files
CREATE POLICY "Doctors can delete medical files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  has_role(auth.uid(), 'doctor'::app_role)
);

-- Add file_url column to diagnoses table if not exists
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_url column to lab_reports table if not exists  
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS file_url TEXT;