import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://imqrvssxfrhivlumhoze.supabase.co';
const supabaseKey = 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV';
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
