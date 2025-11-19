# Document Upload Fix - Summary

## Problem
Documents uploaded through the ImageUploader component were not appearing in Supabase backend.

## Root Cause
The RLS (Row Level Security) policies on the `storage.objects` table were using `has_role(auth.uid(), 'doctor'::app_role)` which depends on the `user_roles` table, but there may have been issues with:
1. The storage bucket not existing
2. RLS policies not being correctly configured
3. User roles not being properly assigned
4. Missing error visibility in the UI

## Solutions Implemented

### 1. Fixed Storage Migration (`supabase/migrations/20251119000000_fix_storage_policies.sql`)
- Ensures `medical-files` bucket exists with correct configuration
- Updated RLS policies to check `doctors` table directly using `user_id` instead of relying on `user_roles`
- Added DOCX and DOC file types to allowed MIME types
- Added UPDATE policy for file overwrites

### 2. Enhanced Error Logging (`AddDiagnosis.tsx` & `AddLabReport.tsx`)
- Added detailed console logging before, during, and after file upload
- Logs file name, size, type, and upload path
- Shows upload success/failure with full error details
- Helps diagnose issues in real-time

### 3. Visual Upload Status Indicator (Both Add Pages)
- Added green status box showing selected file name and size
- Confirms file is ready to upload
- Updates button text to show file will be uploaded
- Provides immediate user feedback

### 4. Diagnostic Tools
- **`storage-diagnostics.sql`**: SQL queries to check bucket, policies, roles, and files
- **`verify-storage.ts`**: TypeScript script to test storage setup programmatically
- **`DOCUMENT_UPLOAD_TROUBLESHOOTING.md`**: Complete troubleshooting guide

## What You Need to Do

### Step 1: Apply the Migration ⚠️ IMPORTANT
Run the new migration to fix storage policies:

**Option A: Using Supabase CLI**
```bash
cd "c:\Users\KRISH AGRAWAL\OneDrive\Desktop\sem V\mini\carepath-central-1911"
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20251119000000_fix_storage_policies.sql`
4. Paste and run it

### Step 2: Verify Setup
Run diagnostic queries from `storage-diagnostics.sql` in Supabase SQL Editor to check:
- Bucket exists
- Policies are correct
- Your user has doctor role
- Files are being stored

### Step 3: Test Upload
1. Log in as a doctor user
2. Navigate to "Add Diagnosis" or "Add Lab Report"
3. Use the AI Scanner to upload a document
4. Open browser DevTools (F12) → Console tab
5. Click "Scan and Auto-Fill with AI"
6. Watch for console messages:
   ```
   Starting file upload: filename.pdf
   File size: 12345 bytes
   File type: application/pdf
   Uploading to path: diagnoses/123/abc_1234567890.pdf
   File uploaded successfully
   ```
7. Fill in the form
8. Look for the green "File ready to upload" box
9. Click "Save Diagnosis & Upload File"
10. Check console for upload success/error

### Step 4: Verify in Supabase
1. Go to Supabase Dashboard → Storage → medical-files
2. You should see folders: `diagnoses/`, `lab-reports/`
3. Navigate into the folder to see uploaded files

## How File Upload Works

### Flow:
1. **User uploads document** → ImageUploader component
2. **AI analyzes document** → Gemini extracts data
3. **Data auto-fills form** → Form fields populated
4. **File stored temporarily** → `selectedFile` state variable
5. **User clicks Submit** → Form submission triggered
6. **File uploads to Supabase** → `supabase.storage.from('medical-files').upload()`
7. **File path saved to database** → `file_url` or `file_path` column
8. **Success notification** → Toast message

### Storage Path Structure:
```
medical-files/
├── diagnoses/
│   └── {patient_id}/
│       └── {random}_{timestamp}.{ext}
├── lab-reports/
│   └── {patient_id}/
│       └── {random}_{timestamp}.{ext}
└── prescriptions/
    └── {patient_id}/
        └── {random}_{timestamp}.{ext}
```

## Troubleshooting

### If upload still fails:
1. Check browser console for detailed error
2. Run diagnostic queries in `storage-diagnostics.sql`
3. Verify user has doctor role
4. Check Supabase logs in Dashboard
5. Refer to `DOCUMENT_UPLOAD_TROUBLESHOOTING.md`

### Common Errors:

**"new row violates row-level security policy"**
→ User doesn't have doctor role. Check `user_roles` table.

**"Bucket not found"**
→ Run the migration to create the bucket.

**"File upload failed: Invalid MIME type"**
→ File type not allowed. Check bucket configuration.

**"Doctor profile not found"**
→ Complete doctor profile setup first.

## Files Modified

1. ✅ `src/pages/AddDiagnosis.tsx` - Enhanced logging & UI
2. ✅ `src/pages/AddLabReport.tsx` - Enhanced logging & UI
3. ✅ `supabase/migrations/20251119000000_fix_storage_policies.sql` - Fixed policies
4. ✅ `storage-diagnostics.sql` - Diagnostic queries (NEW)
5. ✅ `verify-storage.ts` - Verification script (NEW)
6. ✅ `DOCUMENT_UPLOAD_TROUBLESHOOTING.md` - Troubleshooting guide (NEW)
7. ✅ `DOCUMENT_UPLOAD_FIX_SUMMARY.md` - This file (NEW)

## Next Steps After Fix

Once uploads are working:
1. Test with various file types (PDF, JPG, PNG, DOCX)
2. Verify files appear in Supabase Storage
3. Check database records have correct file paths
4. Test file download/viewing functionality
5. Consider adding file preview feature
6. Add file deletion functionality if needed

## Questions?

Refer to `DOCUMENT_UPLOAD_TROUBLESHOOTING.md` for detailed troubleshooting steps.
