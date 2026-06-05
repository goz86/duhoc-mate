import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('client/.env not found');
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: exams, error: examError } = await supabase
    .from('topik_exams')
    .select('*')
    .order('created_at', { ascending: false });

  if (examError) {
    console.error('Error fetching exams:', examError);
    return;
  }

  console.log(`Found ${exams.length} exams:`);
  for (const exam of exams) {
    const { count, error: qError } = await supabase
      .from('topik_exam_questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', exam.id);
    
    console.log(`- ID: ${exam.id} | Title: "${exam.title}" | Category: ${exam.category} | Created by: ${exam.created_by} | Questions: ${count}`);
  }
}

main();
