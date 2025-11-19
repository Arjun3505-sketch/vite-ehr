# Document Upload Troubleshooting Guide

## Issue: Documents not appearing in Supabase backend

This guide will help you diagnose and fix issues with document uploads to Supabase storage.

## Step 1: Run the Storage Migration

The new migration file fixes the RLS (Row Level Security) policies to properly check user permissions.

Run this migration in your Supabase SQL Editor:

```bash
# The migration is located at:
supabase/migrations/20251119000000_fix_storage_policies.sql
```

Or apply it via Supabase CLI:
```bash
supabase db push
```

## Step 2: Run Diagnostic Queries

Open the Supabase SQL Editor and run the queries in `storage-diagnostics.sql` to check:

1. ✅ If the `medical-files` bucket exists
2. ✅ If storage policies are correctly configured
3. ✅ If your user has the doctor role
4. ✅ If files are being stored (even if you can't see them)
5. ✅ If your user can upload files

## Step 3: Check Browser Console

When you submit a document:

1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for these log messages:
   - "Starting file upload: [filename]"
   - "File size: [size] bytes"
   - "Uploading to path: [path]"
   - "File uploaded successfully" ← Should see this if upload works

4. If you see an error, it will show:
   - "Upload error details:" followed by the error message

## Step 4: Check User Roles

Run this query in Supabase SQL Editor:

```sql
-- Check if you have a doctor role
SELECT 
  ur.role,
  d.id as doctor_id,
  d.user_id
FROM user_roles ur
LEFT JOIN doctors d ON d.user_id = ur.user_id
WHERE ur.user_id = auth.uid();
```

Expected result:
- role: 'doctor'
- doctor_id: should not be null
- user_id: should match your auth.uid()

If this returns no rows or doctor_id is null:
- You need to complete doctor profile setup
- The user_roles table might not have a 'doctor' entry for your user

## Step 5: Manual Role Assignment (if needed)

If you don't have the doctor role, run this:

```sql
-- Replace YOUR_USER_ID with your actual user ID from auth.users
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'doctor')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Step 6: Verify Bucket Permissions

Check storage bucket configuration in Supabase Dashboard:

1. Go to Storage → Policies
2. Find the `medical-files` bucket
3. Verify these policies exist:
   - "Doctors can upload medical files" (INSERT)
   - "Doctors can view all medical files" (SELECT)
   - "Doctors can delete medical files" (DELETE)
   - "Doctors can update medical files" (UPDATE)

## Step 7: Test File Upload

1. Navigate to Add Diagnosis or Add Lab Report
2. Use the AI Scanner to upload a document
3. Click "Scan and Auto-Fill with AI"
4. Fill in the required fields
5. Look for the green status box that shows "File ready to upload"
6. Click "Save Diagnosis & Upload File" or "Upload File & Save Report"
7. Watch the browser console for upload messages

## Common Issues and Solutions

### Issue: "new row violates row-level security policy"
**Solution:** The user doesn't have proper permissions. Check Step 4 and 5.

### Issue: "Bucket not found"
**Solution:** The `medical-files` bucket doesn't exist. Run Step 1 to create it.

### Issue: "File upload failed: Invalid MIME type"
**Solution:** The file type is not allowed. Add it to the allowed_mime_types in the migration.

### Issue: Files upload but don't appear in database tables
**Solution:** Check if `file_url` (diagnoses) or `file_path` (lab_reports) columns exist:

```sql
-- For diagnoses
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' AND column_name = 'file_url';

-- For lab_reports
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_reports' AND column_name = 'file_path';
```

### Issue: "Doctor profile not found"
**Solution:** Complete your doctor profile setup first.

## Enhanced Logging

The code now includes detailed console logging:
- File name, size, and type before upload
- Upload path
- Success/error messages with full details

Check your browser console (F12 → Console tab) to see these messages.

## Still Having Issues?

1. Check the Supabase logs in Dashboard → Logs
2. Verify your Supabase project URL and anon key in `.env`
3. Make sure you're logged in as a doctor user
4. Clear browser cache and try again
5. Check Network tab in DevTools to see the actual API calls

## Contact

If you're still experiencing issues after following these steps, please provide:
1. Browser console output
2. Results from diagnostic queries
3. Screenshots of any error messages
