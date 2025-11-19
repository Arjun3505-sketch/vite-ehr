-- Diagnostic queries to check storage bucket setup
-- Run these in your Supabase SQL Editor to verify everything is configured correctly

-- 1. Check if the medical-files bucket exists
SELECT * FROM storage.buckets WHERE id = 'medical-files';

-- 2. Check storage policies for the medical-files bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND qual LIKE '%medical-files%';

-- 3. Check if the current user has a doctor role
SELECT 
  ur.role,
  d.id as doctor_id,
  d.user_id
FROM user_roles ur
LEFT JOIN doctors d ON d.user_id = ur.user_id
WHERE ur.user_id = auth.uid();

-- 4. Check all files in the medical-files bucket
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'medical-files'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Test if the current user can insert into storage (dry run check)
SELECT 
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()
  ) as can_upload_files;

-- 6. Check diagnoses with file paths
SELECT 
  id,
  patient_id,
  doctor_id,
  date,
  condition,
  file_url,
  created_at
FROM diagnoses
WHERE file_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check lab reports with file paths
SELECT 
  id,
  patient_id,
  doctor_id,
  date,
  report_type,
  file_path,
  created_at
FROM lab_reports
WHERE file_path IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
