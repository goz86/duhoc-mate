import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imqrvssxfrhivlumhoze.supabase.co';
const supabaseKey = 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('===================================================');
  console.log('🔌 CONNECTING TO DATABASE TO REPAIR EXAM IMAGES');
  console.log('===================================================');

  // 1. Fetch all reading exams
  const { data: exams, error: examError } = await supabase
    .from('topik_exams')
    .select('id, title, category');

  if (examError) {
    console.error('Error fetching exams:', examError);
    return;
  }

  const readingExams = exams.filter(e => e.category === 'reading');
  console.log(`Found ${readingExams.length} reading exams in database.`);

  let totalUpdated = 0;

  for (const exam of readingExams) {
    // Extract Kỳ number from title (e.g. "De thi chinh thuc TOPIK II Doc - Ky 64" -> 64)
    const match = exam.title.match(/K[ỳy]\s*(\d+)/i) || exam.title.match(/TOPIK\s*I+\s*(?:Đọc|Nghe)?\s*-\s*Số\s*(\d+)/i) || exam.title.match(/Số\s*(\d+)/i);
    if (!match) {
      console.log(`[SKIP] Could not extract session from title: "${exam.title}"`);
      continue;
    }
    const ky = parseInt(match[1]);
    console.log(`\n[EXAM] "${exam.title}" -> Kỳ ${ky}`);

    // Fetch all questions for this exam
    const { data: questions, error: qError } = await supabase
      .from('topik_exam_questions')
      .select('id, question_number, question_type, audio_script')
      .eq('exam_id', exam.id);

    if (qError) {
      console.error(`  Error fetching questions for exam ${exam.id}:`, qError);
      continue;
    }

    console.log(`  Found ${questions.length} questions.`);

    for (const q of questions) {
      // Determine Dạng from question_type (e.g. "reading_dang_1" -> "1")
      // Wait, some might be "grammar_fill" or others for AI-generated exams.
      // We only fix the imported official ones whose type starts with "reading_dang_"
      if (!q.question_type.startsWith('reading_dang_')) {
        continue;
      }
      
      const dang = q.question_type.replace('reading_dang_', '');
      let suffix = '';

      if (dang === '10') {
        suffix = [28, 29].includes(q.question_number) ? '_p1' : '_p2';
      } else if (dang === '11') {
        suffix = q.question_number === 32 ? '_p1' : '_p2';
      } else if (dang === '12') {
        if ([37, 41].includes(ky)) {
          if (q.question_number === 35) suffix = '_p1';
          else if (q.question_number === 36) suffix = '_p2';
          else suffix = '_p3';
        } else {
          suffix = [35, 36].includes(q.question_number) ? '_p1' : '_p2';
        }
      } else if (dang === '13') {
        suffix = q.question_number === 39 ? '_p1' : '_p2';
      }

      const imgPath = `/topik_exams/dang_${dang}_ky_${ky}${suffix}.jpg`;

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('topik_exam_questions')
        .update({ audio_script: imgPath })
        .eq('id', q.id);

      if (updateError) {
        console.error(`    [ERROR] Failed to update Q#${q.question_number}:`, updateError.message);
      } else {
        totalUpdated++;
      }
    }
    console.log(`  Finished updating questions for "${exam.title}".`);
  }

  console.log(`\n🎉 DONE! Updated ${totalUpdated} question image references in database.`);
}

main();
