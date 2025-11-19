import { supabase } from "./src/integrations/supabase/client";

/**
 * Verification script to test storage bucket and permissions
 * Run with: node verify-storage.js (after compiling) or directly in browser console
 */

async function verifyStorageSetup() {
  console.log("🔍 Starting Storage Verification...\n");

  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("❌ Not authenticated. Please log in first.");
      return;
    }
    
    console.log("✅ Authenticated as:", user.email);
    console.log("   User ID:", user.id);

    // 2. Check doctor profile
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('id, user_id, specialization')
      .eq('user_id', user.id)
      .single();

    if (doctorError || !doctorData) {
      console.error("❌ Doctor profile not found");
      console.error("   Error:", doctorError?.message);
      return;
    }

    console.log("✅ Doctor profile found");
    console.log("   Doctor ID:", doctorData.id);

    // 3. Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error("❌ Error checking roles:", roleError.message);
    } else if (roleData && roleData.length > 0) {
      console.log("✅ User roles:", roleData.map(r => r.role).join(', '));
    } else {
      console.warn("⚠️  No roles found in user_roles table");
    }

    // 4. Check storage buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError.message);
    } else {
      const medicalFilesBucket = buckets?.find(b => b.id === 'medical-files');
      if (medicalFilesBucket) {
        console.log("✅ Storage bucket 'medical-files' exists");
        console.log("   Public:", medicalFilesBucket.public);
        console.log("   File size limit:", medicalFilesBucket.file_size_limit, "bytes");
      } else {
        console.error("❌ Storage bucket 'medical-files' not found");
        console.log("   Available buckets:", buckets?.map(b => b.id).join(', '));
      }
    }

    // 5. Try to list files (to test SELECT permission)
    const { data: files, error: filesError } = await supabase
      .storage
      .from('medical-files')
      .list();

    if (filesError) {
      console.error("❌ Cannot list files in medical-files bucket");
      console.error("   Error:", filesError.message);
    } else {
      console.log("✅ Can list files in medical-files bucket");
      console.log("   Files found:", files?.length || 0);
    }

    // 6. Test file upload permission with a tiny test file
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    const testPath = `test/${user.id}/test-${Date.now()}.txt`;

    console.log("\n🧪 Testing file upload permission...");
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('medical-files')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ File upload test FAILED");
      console.error("   Error:", uploadError.message);
      console.error("   Error details:", uploadError);
    } else {
      console.log("✅ File upload test SUCCESSFUL");
      console.log("   Uploaded to:", testPath);
      
      // Clean up test file
      await supabase.storage.from('medical-files').remove([testPath]);
      console.log("   (Test file cleaned up)");
    }

    console.log("\n✨ Verification complete!");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run verification
verifyStorageSetup();

export { verifyStorageSetup };
