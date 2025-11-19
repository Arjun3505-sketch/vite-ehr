# 🔧 IMMEDIATE FIX REQUIRED - Document Upload Issue

## 🚨 ROOT CAUSE IDENTIFIED

**The problem:** Doctors don't have the 'doctor' role in the `user_roles` table!

- When you sign up, the system creates a 'patient' role in `user_roles`
- When you complete doctor profile setup, it creates a record in `doctors` table
- **BUT it never creates a 'doctor' entry in `user_roles`**
- Storage policies check `user_roles` for the 'doctor' role → Upload fails!

## ✅ COMPLETE FIX (Do These Steps in Order)

### Step 1: Apply the Storage Migration

Open Supabase SQL Editor and run this file:
```
supabase/migrations/20251119000000_fix_storage_policies.sql
```

Or using Supabase CLI:
```bash
cd "c:\Users\KRISH AGRAWAL\OneDrive\Desktop\sem V\mini\carepath-central-1911"
supabase db push
```

This will:
- Ensure the `medical-files` bucket exists
- Update storage policies to check BOTH `user_roles` AND `doctors` table
- Support DOCX/DOC files

### Step 2: Fix Existing Doctor Users ⚠️ CRITICAL

Open Supabase SQL Editor and run:
```
fix-existing-doctor-roles.sql
```

This will add the 'doctor' role to ALL existing doctors in the `user_roles` table.

### Step 3: Verify the Fix

In Supabase SQL Editor, run:
```sql
-- Check if YOUR user has the doctor role
SELECT 
  ur.role,
  d.id as doctor_id,
  d.name
FROM user_roles ur
LEFT JOIN doctors d ON d.user_id = ur.user_id
WHERE ur.user_id = auth.uid();
```

Expected result: You should see a row with `role = 'doctor'`

### Step 4: Log Out and Log Back In

**IMPORTANT:** Your browser session needs to be refreshed!

1. Click "Log Out" in your app
2. Log back in with your doctor credentials
3. The session will now have the updated role

### Step 5: Test File Upload

1. Open browser DevTools (F12) → Console tab
2. Navigate to "Add Diagnosis" or "Add Lab Report"
3. Use AI Scanner to upload a document
4. Fill in the form (you'll see a green box confirming file is ready)
5. Click "Save Diagnosis & Upload File"
6. Watch the console for these messages:
   ```
   Starting file upload: filename.pdf
   File size: 12345 bytes
   Uploading to path: diagnoses/123/abc_1234567890.pdf
   File uploaded successfully: {...}
   ```

### Step 6: Verify in Supabase Storage

1. Go to Supabase Dashboard
2. Click "Storage" in sidebar
3. Find "medical-files" bucket
4. You should see folders: `diagnoses/`, `lab-reports/`, `surgeries/`
5. Navigate into the folder to see your uploaded files

## 🔍 What Changed in the Code

### 1. DoctorProfileSetup.tsx
Now creates a 'doctor' role entry in `user_roles` when profile is completed:
```typescript
// Insert doctor role into user_roles table
const { error: roleError } = await supabase
  .from('user_roles')
  .upsert({ user_id: user.id, role: 'doctor' });
```

### 2. Storage Migration (20251119000000_fix_storage_policies.sql)
Updated policies to check BOTH sources:
```sql
WITH CHECK (
  bucket_id = 'medical-files' AND
  (
    has_role(auth.uid(), 'doctor'::app_role) OR  -- Check user_roles
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid()  -- Backup check
    )
  )
)
```

### 3. All Add Pages (AddDiagnosis, AddLabReport, AddSurgery)
- Added detailed console logging for debugging
- Added visual status indicator showing file ready to upload
- Better error messages

## 🧪 Testing Checklist

- [ ] Step 1: Migration applied successfully
- [ ] Step 2: Existing doctors have 'doctor' role in user_roles
- [ ] Step 3: Verified your user has doctor role
- [ ] Step 4: Logged out and back in
- [ ] Step 5: File upload shows console logs
- [ ] Step 6: Files appear in Supabase Storage
- [ ] Diagnosis/Lab Report saved with file_url/file_path populated

## 🆘 Still Not Working?

### Debug Checklist:

1. **Check browser console for errors**
   - Open DevTools (F12) → Console
   - Look for red error messages

2. **Verify doctor role exists**
   ```sql
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```
   Should return: `role = 'doctor'`

3. **Check storage bucket exists**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'medical-files';
   ```
   Should return one row

4. **Check storage policies**
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'objects' 
   AND qual LIKE '%medical-files%';
   ```
   Should show 5 policies (INSERT, SELECT, DELETE, UPDATE for doctors, SELECT for patients)

5. **Test file upload permission directly**
   - Try uploading a file through Supabase Dashboard → Storage
   - If that works, the issue is in the frontend code
   - If that fails, the issue is with policies/roles

## 📋 Quick Reference

### File Paths
- Diagnosis files: `medical-files/diagnoses/{patient_id}/{filename}`
- Lab reports: `medical-files/lab-reports/{patient_id}/{filename}`
- Surgeries: `medical-files/surgeries/{patient_id}/{filename}`

### Database Columns
- `diagnoses.file_url` - stores file path
- `lab_reports.file_path` - stores file path
- `surgeries.file_path` - stores file path

### Required Tables
- `user_roles` - Must have 'doctor' entry for file upload to work
- `doctors` - Must have doctor profile record
- `storage.buckets` - Must have 'medical-files' bucket
- `storage.objects` - Stores actual files

## 🎯 Future Users

New doctors who sign up after this fix will automatically get the 'doctor' role in `user_roles` when they complete their profile setup. No manual intervention needed!

## 📞 Support

If you're still experiencing issues:
1. Share the browser console output
2. Share the result of the verification queries above
3. Screenshot any error messages
