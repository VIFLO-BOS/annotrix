require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const rawSupabaseUrl = process.env.SUPABASE_URL || '';
const projectUrl = rawSupabaseUrl.includes('.storage.supabase.co') 
  ? rawSupabaseUrl.split('.storage.supabase.co')[0] + '.supabase.co' 
  : rawSupabaseUrl;
const supabase = createClient(projectUrl, process.env.SUPABASE_ANON_KEY || '');

async function test() {
  const fileBuffer = Buffer.from('test content');
  const fileName = 'test.txt';
  
  let uploadRes = await supabase.storage.from("exams").upload(fileName, fileBuffer, {
      contentType: 'text/plain',
      upsert: true
  });
  
  if (uploadRes.error && uploadRes.error.message.includes('Bucket not found')) {
      console.log("Bucket not found. Creating bucket 'exams'...");
      const createRes = await supabase.storage.createBucket('exams', { public: true });
      console.log("Create Bucket Result:", createRes);
      
      uploadRes = await supabase.storage.from('exams').upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: true
      });
  }

  console.log("Final Error:", uploadRes.error);
  console.log("Final Data:", uploadRes.data);
}
test();
