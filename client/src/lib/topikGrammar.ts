export type TopikErrorType =
  | 'vocabulary'
  | 'grammar_connector'
  | 'honorific'
  | 'reading'
  | 'similar_meaning'

export type TopikGrammarExample = {
  ko: string
  vi: string
}

export type TopikGrammarPattern = {
  id: string
  level: number
  title: string
  formula: string
  meaningVi: string
  meaningEn: string
  examples: TopikGrammarExample[]
  commonMistake: string
}

export type TopikPracticeQuestion = {
  id: string
  level: number
  gameType?: TopikRoomGameType
  category: 'grammar' | 'vocabulary' | 'reading' | 'sentence'
  errorType: TopikErrorType
  patternId?: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type TopikRoomGameType =
  | 'vocab-speed'
  | 'sentence-build'
  | 'topik-master'
  | 'grammar-race'

export const ERROR_TYPE_LABELS: Record<TopikErrorType, string> = {
  vocabulary: 'Sai từ vựng',
  grammar_connector: 'Sai ngữ pháp nối câu',
  honorific: 'Sai kính ngữ',
  reading: 'Sai đọc hiểu',
  similar_meaning: 'Nhầm nghĩa gần giống',
}

export const ROOM_GAME_LABELS: Record<TopikRoomGameType, { title: string; description: string; rounds: number }> = {
  'vocab-speed': {
    title: 'Nhanh tay chọn nghĩa',
    description: 'Hiện từ tiếng Hàn, ai chọn nghĩa đúng nhanh nhất được nhiều điểm.',
    rounds: 3,
  },
  'sentence-build': {
    title: 'Ghép câu',
    description: 'Chọn thứ tự/cụm đúng để hoàn thành câu tiếng Hàn tự nhiên.',
    rounds: 2,
  },
  'topik-master': {
    title: 'Ai là TOPIK Master',
    description: 'Quiz 10 câu trộn từ vựng, ngữ pháp và đọc hiểu, có bảng xếp hạng.',
    rounds: 10,
  },
  'grammar-race': {
    title: 'Grammar Race',
    description: 'Câu trống ngữ pháp, chọn nhanh mẫu đúng để thắng vòng.',
    rounds: 3,
  },
}

export const TOPIK_GRAMMAR_PATTERNS: TopikGrammarPattern[] = [
  {
    id: 'g1-go-sipda',
    level: 1,
    title: '-고 싶다',
    formula: 'V-고 싶다',
    meaningVi: 'Muốn làm gì đó.',
    meaningEn: 'Want to do something.',
    examples: [
      { ko: '한국어를 배우고 싶어요.', vi: 'Tôi muốn học tiếng Hàn.' },
      { ko: '주말에 쉬고 싶어요.', vi: 'Cuối tuần tôi muốn nghỉ.' },
    ],
    commonMistake: 'Không dùng trực tiếp với danh từ. Hãy đổi sang động từ: 김치를 먹고 싶어요.',
  },
  {
    id: 'g1-euro-gada',
    level: 1,
    title: '-으러/러 가다',
    formula: 'V-(으)러 가다/오다',
    meaningVi: 'Đi/đến để làm một việc gì đó.',
    meaningEn: 'Go/come in order to do something.',
    examples: [
      { ko: '책을 사러 서점에 가요.', vi: 'Tôi đến hiệu sách để mua sách.' },
      { ko: '친구를 만나러 카페에 왔어요.', vi: 'Tôi đến quán cà phê để gặp bạn.' },
    ],
    commonMistake: 'Chỉ dùng với động từ chỉ mục đích, phía sau thường là 가다/오다/다니다.',
  },
  {
    id: 'g1-eul-geoyeyo',
    level: 1,
    title: '-을/ㄹ 거예요',
    formula: 'V-(으)ㄹ 거예요',
    meaningVi: 'Sẽ làm gì; diễn tả dự định hoặc dự đoán tương lai.',
    meaningEn: 'Will; used for future plans or predictions.',
    examples: [
      { ko: '내일 친구를 만날 거예요.', vi: 'Ngày mai tôi sẽ gặp bạn.' },
      { ko: '주말에 공부할 거예요.', vi: 'Cuối tuần tôi sẽ học.' },
    ],
    commonMistake: 'Không gắn trực tiếp sau danh từ. Với danh từ dùng N일 거예요.',
  },
  {
    id: 'g1-aseo-eoseo',
    level: 1,
    title: '-아서/어서',
    formula: 'V/A-아서/어서',
    meaningVi: 'Vì/nên hoặc rồi; dùng cho nguyên nhân tự nhiên và trình tự hành động.',
    meaningEn: 'Because/so, or and then; used for reasons and sequence.',
    examples: [
      { ko: '비가 와서 집에 있었어요.', vi: 'Vì trời mưa nên tôi ở nhà.' },
      { ko: '학교에 가서 친구를 만났어요.', vi: 'Tôi đến trường rồi gặp bạn.' },
    ],
    commonMistake: 'Không dùng với câu mệnh lệnh/rủ rê khi nêu lý do; hãy dùng -(으)니까.',
  },
  {
    id: 'g1-go',
    level: 1,
    title: '-고',
    formula: 'V/A-고',
    meaningVi: 'Và; nối hai hành động hoặc tính chất ngang hàng.',
    meaningEn: 'And; links two actions or states.',
    examples: [
      { ko: '밥을 먹고 커피를 마셔요.', vi: 'Tôi ăn cơm và uống cà phê.' },
      { ko: '이 방은 깨끗하고 조용해요.', vi: 'Phòng này sạch và yên tĩnh.' },
    ],
    commonMistake: 'Không dùng -고 để thể hiện nguyên nhân-kết quả rõ ràng; khi đó dùng -아서/어서.',
  },
  {
    id: 'g1-ji-anhda',
    level: 1,
    title: '-지 않다',
    formula: 'V/A-지 않다',
    meaningVi: 'Không làm gì/không như thế.',
    meaningEn: 'Not; negative form for verbs and adjectives.',
    examples: [
      { ko: '오늘은 학교에 가지 않아요.', vi: 'Hôm nay tôi không đi học.' },
      { ko: '이 음식은 맵지 않아요.', vi: 'Món này không cay.' },
    ],
    commonMistake: 'Đừng dùng 안 và -지 않다 cùng lúc trong một vị ngữ: 안 가지 않아요 là sai trong văn cảnh thường.',
  },
  {
    id: 'g1-eul-su-issda',
    level: 1,
    title: '-을/ㄹ 수 있다',
    formula: 'V-(으)ㄹ 수 있다/없다',
    meaningVi: 'Có thể/không thể làm gì.',
    meaningEn: 'Can/cannot do something.',
    examples: [
      { ko: '한국어를 읽을 수 있어요.', vi: 'Tôi có thể đọc tiếng Hàn.' },
      { ko: '오늘은 갈 수 없어요.', vi: 'Hôm nay tôi không thể đi.' },
    ],
    commonMistake: 'Đừng nhầm khả năng -을 수 있다 với dự định tương lai -을 거예요.',
  },
  {
    id: 'g1-a-eo-boda',
    level: 1,
    title: '-아/어 보다',
    formula: 'V-아/어 보다',
    meaningVi: 'Thử làm gì; đã từng thử/trải nghiệm.',
    meaningEn: 'Try doing; have the experience of doing.',
    examples: [
      { ko: '김치를 먹어 봤어요.', vi: 'Tôi đã thử ăn kimchi.' },
      { ko: '이 문제를 풀어 보세요.', vi: 'Hãy thử giải bài này.' },
    ],
    commonMistake: 'Không viết 보다 sau tính từ để diễn tả “trông có vẻ”; đó là mẫu -아/어 보이다.',
  },
  {
    id: 'g2-eumyeon',
    level: 2,
    title: '-으면/면',
    formula: 'V/A-(으)면',
    meaningVi: 'Nếu/khi một điều kiện xảy ra.',
    meaningEn: 'If/when a condition happens.',
    examples: [
      { ko: '시간이 있으면 같이 공부해요.', vi: 'Nếu có thời gian thì học cùng nhé.' },
      { ko: '날씨가 좋으면 산책할 거예요.', vi: 'Nếu thời tiết đẹp tôi sẽ đi dạo.' },
    ],
    commonMistake: 'Không dùng hai lần điều kiện trong cùng một vế: 시간이 있으면 만나요 là đủ.',
  },
  {
    id: 'g2-gie-jeone',
    level: 2,
    title: '-기 전에',
    formula: 'V-기 전에',
    meaningVi: 'Trước khi làm gì.',
    meaningEn: 'Before doing something.',
    examples: [
      { ko: '자기 전에 숙제를 했어요.', vi: 'Trước khi ngủ tôi đã làm bài tập.' },
      { ko: '시험 보기 전에 단어를 외워요.', vi: 'Trước khi thi tôi học thuộc từ vựng.' },
    ],
    commonMistake: 'Không chia thì ở động từ trước -기 전에: 먹기 전에, không viết 먹었기 전에.',
  },
  {
    id: 'g2-go-naseo',
    level: 2,
    title: '-고 나서',
    formula: 'V-고 나서',
    meaningVi: 'Sau khi làm xong một việc rồi mới làm việc khác.',
    meaningEn: 'After finishing one action, then doing another.',
    examples: [
      { ko: '숙제를 하고 나서 영화를 봤어요.', vi: 'Sau khi làm bài tập xong tôi xem phim.' },
      { ko: '밥을 먹고 나서 약을 드세요.', vi: 'Sau khi ăn cơm xong hãy uống thuốc.' },
    ],
    commonMistake: 'Nhấn mạnh hoàn thành hành động trước; nếu chỉ nối hành động đơn giản, -고 có thể đủ.',
  },
  {
    id: 'g2-eul-kka-yo',
    level: 2,
    title: '-을/ㄹ까요?',
    formula: 'V-(으)ㄹ까요?',
    meaningVi: 'Hay là...? dùng để hỏi ý kiến, đề nghị hoặc tự hỏi.',
    meaningEn: 'Shall we/should I; asks for opinion or suggests.',
    examples: [
      { ko: '같이 공부할까요?', vi: 'Chúng ta học cùng nhé?' },
      { ko: '무엇을 먹을까요?', vi: 'Chúng ta ăn gì nhỉ?' },
    ],
    commonMistake: 'Không dùng như câu trần thuật; đây là dạng câu hỏi/đề nghị.',
  },
  {
    id: 'g2-eu-nikka',
    level: 2,
    title: '-으니까/니까',
    formula: 'V/A-(으)니까',
    meaningVi: 'Vì... nên; thường dùng với mệnh lệnh, đề nghị, rủ rê.',
    meaningEn: 'Because; often used with commands and suggestions.',
    examples: [
      { ko: '날씨가 추우니까 코트를 입으세요.', vi: 'Vì trời lạnh nên hãy mặc áo khoác.' },
      { ko: '시간이 없으니까 택시를 탑시다.', vi: 'Vì không có thời gian nên đi taxi nhé.' },
    ],
    commonMistake: 'Với miêu tả kết quả tự nhiên, -아서/어서 thường mềm hơn.',
  },
  {
    id: 'g2-eumyeonseo',
    level: 2,
    title: '-으면서/면서',
    formula: 'V-(으)면서',
    meaningVi: 'Vừa làm việc này vừa làm việc khác.',
    meaningEn: 'While doing; doing two actions simultaneously.',
    examples: [
      { ko: '음악을 들으면서 공부해요.', vi: 'Tôi vừa nghe nhạc vừa học.' },
      { ko: '걸으면서 전화했어요.', vi: 'Tôi vừa đi bộ vừa gọi điện.' },
    ],
    commonMistake: 'Chủ ngữ hai vế thường phải là một người; nếu khác chủ ngữ cần cấu trúc khác.',
  },
  {
    id: 'g2-a-ya-hada',
    level: 2,
    title: '-아/어야 하다',
    formula: 'V-아/어야 하다',
    meaningVi: 'Phải làm gì; diễn tả nghĩa vụ/cần thiết.',
    meaningEn: 'Must/have to do something.',
    examples: [
      { ko: '내일까지 숙제를 해야 해요.', vi: 'Tôi phải làm bài tập trước ngày mai.' },
      { ko: '시험 전에 단어를 외워야 해요.', vi: 'Trước kỳ thi phải học thuộc từ vựng.' },
    ],
    commonMistake: 'Không nhầm với -고 싶다; một bên là muốn, một bên là phải.',
  },
  {
    id: 'g2-boda-comparison',
    level: 2,
    title: '보다',
    formula: 'N보다',
    meaningVi: 'So với; dùng trong câu so sánh hơn.',
    meaningEn: 'Than; used in comparative sentences.',
    examples: [
      { ko: '오늘은 어제보다 더 추워요.', vi: 'Hôm nay lạnh hơn hôm qua.' },
      { ko: '지하철이 버스보다 빨라요.', vi: 'Tàu điện ngầm nhanh hơn xe buýt.' },
    ],
    commonMistake: 'Không dùng 보다 một mình; cần tính từ/trạng từ so sánh ở vị ngữ.',
  },
  {
    id: 'g3-neun-baram-e',
    level: 3,
    title: '-는 바람에',
    formula: 'V-는 바람에',
    meaningVi: 'Vì một việc bất ngờ/tiêu cực xảy ra nên dẫn đến kết quả không mong muốn.',
    meaningEn: 'Because something unexpected happened, usually causing a negative result.',
    examples: [
      { ko: '비가 오는 바람에 소풍이 취소됐어요.', vi: 'Vì trời mưa nên chuyến dã ngoại bị hủy.' },
      { ko: '버스를 놓치는 바람에 늦었어요.', vi: 'Vì lỡ xe buýt nên tôi đến muộn.' },
    ],
    commonMistake: 'Không dùng cho kết quả tích cực tự nhiên. Với lý do trung tính hãy dùng -아서/어서 hoặc -기 때문에.',
  },
  {
    id: 'g3-dorok',
    level: 3,
    title: '-도록',
    formula: 'V-도록',
    meaningVi: 'Để/nhằm đạt mục tiêu hoặc mức độ nào đó.',
    meaningEn: 'So that, in order to, or to the extent that.',
    examples: [
      { ko: '잊지 않도록 메모하세요.', vi: 'Hãy ghi chú để không quên.' },
      { ko: '모두 들을 수 있도록 크게 말해 주세요.', vi: 'Hãy nói to để mọi người đều nghe được.' },
    ],
    commonMistake: 'Nếu chỉ nêu mục đích đơn giản với danh từ địa điểm, -으러 có thể tự nhiên hơn.',
  },
  {
    id: 'g3-ge-doeda',
    level: 3,
    title: '-게 되다',
    formula: 'V-게 되다',
    meaningVi: 'Trở nên/được dẫn đến việc làm gì; nhấn mạnh thay đổi hoặc kết quả.',
    meaningEn: 'Come to; end up doing due to a change or circumstance.',
    examples: [
      { ko: '한국 회사에서 일하게 됐어요.', vi: 'Tôi đã được làm ở công ty Hàn Quốc.' },
      { ko: '친구 덕분에 한국어를 배우게 됐어요.', vi: 'Nhờ bạn mà tôi bắt đầu học tiếng Hàn.' },
    ],
    commonMistake: 'Không dùng khi muốn nói chủ ý mạnh ngay từ đầu; mẫu này nhấn vào sự chuyển biến.',
  },
  {
    id: 'g3-na-boda',
    level: 3,
    title: '-나 보다',
    formula: 'V-나 보다 / A-(으)ㄴ가 보다',
    meaningVi: 'Có vẻ như; suy đoán dựa trên dấu hiệu nhìn/nghe thấy.',
    meaningEn: 'It seems; guess based on observable evidence.',
    examples: [
      { ko: '불이 꺼져 있어요. 아무도 없나 봐요.', vi: 'Đèn tắt rồi. Có vẻ không có ai.' },
      { ko: '사람이 많네요. 맛있는가 봐요.', vi: 'Đông người nhỉ. Có vẻ ngon.' },
    ],
    commonMistake: 'Không dùng cho suy đoán hoàn toàn không có căn cứ; khi đó dùng -(으)ㄹ 것 같다.',
  },
  {
    id: 'g3-eul-su-bakke-eopda',
    level: 3,
    title: '-을/ㄹ 수밖에 없다',
    formula: 'V-(으)ㄹ 수밖에 없다',
    meaningVi: 'Không còn cách nào khác ngoài việc phải làm gì.',
    meaningEn: 'Have no choice but to do something.',
    examples: [
      { ko: '비가 너무 와서 취소할 수밖에 없어요.', vi: 'Mưa quá to nên không còn cách nào ngoài hủy.' },
      { ko: '시간이 없어서 택시를 탈 수밖에 없었어요.', vi: 'Không có thời gian nên tôi đành đi taxi.' },
    ],
    commonMistake: 'Không dùng cho lựa chọn vui vẻ/tự nguyện; nó có sắc thái bị buộc phải làm.',
  },
  {
    id: 'g3-deoni',
    level: 3,
    title: '-더니',
    formula: 'V/A-더니',
    meaningVi: 'Sau khi/đã thấy... thì; nối điều quan sát trước với kết quả sau.',
    meaningEn: 'After observing that..., then; links observed fact and result.',
    examples: [
      { ko: '열심히 공부하더니 시험을 잘 봤어요.', vi: 'Thấy học chăm rồi cuối cùng thi tốt.' },
      { ko: '아침부터 춥더니 눈이 오네요.', vi: 'Từ sáng đã lạnh, giờ tuyết rơi rồi.' },
    ],
    commonMistake: 'Thường dùng với điều người nói đã trực tiếp trải nghiệm/quan sát.',
  },
  {
    id: 'g3-neun-daemune',
    level: 3,
    title: '-기 때문에',
    formula: 'V/A-기 때문에 / N 때문에',
    meaningVi: 'Vì; diễn tả nguyên nhân rõ ràng, hơi trang trọng hơn -아서/어서.',
    meaningEn: 'Because; gives a clear reason, slightly formal.',
    examples: [
      { ko: '시험이 있기 때문에 일찍 자야 해요.', vi: 'Vì có kỳ thi nên phải ngủ sớm.' },
      { ko: '교통 때문에 늦었어요.', vi: 'Tôi muộn vì giao thông.' },
    ],
    commonMistake: 'Không dùng trực tiếp với mệnh lệnh/rủ rê tự nhiên bằng -기 때문에; dùng -(으)니까 sẽ hợp hơn.',
  },
  {
    id: 'g3-eul-mankeum',
    level: 3,
    title: '-을/ㄹ 만큼',
    formula: 'V-(으)ㄹ 만큼 / A-(으)ㄴ 만큼',
    meaningVi: 'Đến mức; bằng với mức độ nào đó.',
    meaningEn: 'To the extent that; as much as.',
    examples: [
      { ko: '눈물이 날 만큼 감동적이었어요.', vi: 'Cảm động đến mức rơi nước mắt.' },
      { ko: '혼자 할 수 있을 만큼 쉬워요.', vi: 'Dễ đến mức có thể tự làm một mình.' },
    ],
    commonMistake: 'Không nhầm với -처럼. -만큼 nhấn mạnh mức độ/số lượng tương đương.',
  },
  {
    id: 'g4-neun-dae-banhae',
    level: 4,
    title: '-는 데 반해',
    formula: 'V-는 데 반해 / A-(으)ㄴ 데 반해',
    meaningVi: 'Trái lại, dùng để so sánh hai ý đối lập.',
    meaningEn: 'In contrast to; used to compare opposing facts.',
    examples: [
      { ko: '형은 조용한 데 반해 동생은 활발해요.', vi: 'Anh thì trầm lặng, trái lại em thì năng động.' },
      { ko: '도시는 편리한 데 반해 생활비가 비싸요.', vi: 'Thành phố tiện lợi, nhưng trái lại chi phí sinh hoạt đắt.' },
    ],
    commonMistake: 'Hai vế phải có quan hệ đối lập rõ ràng, không chỉ là hai thông tin cùng chiều.',
  },
  {
    id: 'g4-eul-bbunman-anira',
    level: 4,
    title: '-을 뿐만 아니라',
    formula: 'V/A-(으)ㄹ 뿐만 아니라 N뿐만 아니라',
    meaningVi: 'Không chỉ... mà còn...',
    meaningEn: 'Not only... but also...',
    examples: [
      { ko: '이 앱은 편리할 뿐만 아니라 디자인도 예뻐요.', vi: 'Ứng dụng này không chỉ tiện lợi mà thiết kế cũng đẹp.' },
      { ko: '그는 한국어뿐만 아니라 영어도 잘해요.', vi: 'Anh ấy không chỉ giỏi tiếng Hàn mà còn giỏi tiếng Anh.' },
    ],
    commonMistake: 'Sau vế sau thường dùng 도 để nhấn mạnh “cũng/còn”.',
  },
  {
    id: 'g4-neun-pyeonida',
    level: 4,
    title: '-는 편이다',
    formula: 'V-는 편이다 / A-(으)ㄴ 편이다',
    meaningVi: 'Thuộc loại/khá là; đánh giá ở mức tương đối.',
    meaningEn: 'Tend to be; rather/relatively.',
    examples: [
      { ko: '저는 아침에 일찍 일어나는 편이에요.', vi: 'Tôi thuộc kiểu dậy sớm.' },
      { ko: '이 식당은 가격이 비싼 편이에요.', vi: 'Quán này khá đắt.' },
    ],
    commonMistake: 'Không dùng khi muốn khẳng định tuyệt đối; nó mang sắc thái tương đối.',
  },
  {
    id: 'g4-eul-jul-alda',
    level: 4,
    title: '-을/ㄹ 줄 알다',
    formula: 'V-(으)ㄹ 줄 알다/모르다',
    meaningVi: 'Biết/không biết cách làm gì; cũng có thể diễn tả đã tưởng rằng.',
    meaningEn: 'Know how to; also can mean thought that.',
    examples: [
      { ko: '저는 김치를 만들 줄 알아요.', vi: 'Tôi biết làm kimchi.' },
      { ko: '오늘 비가 올 줄 알았어요.', vi: 'Tôi đã tưởng hôm nay sẽ mưa.' },
    ],
    commonMistake: 'Cần phân biệt “biết cách làm” với “biết sự thật” là -는지 알다.',
  },
  {
    id: 'g4-ge-mandeulda',
    level: 4,
    title: '-게 만들다',
    formula: 'V/A-게 만들다',
    meaningVi: 'Làm cho ai/cái gì trở nên hoặc làm gì.',
    meaningEn: 'Make someone/something become or do something.',
    examples: [
      { ko: '그 영화는 사람들을 웃게 만들어요.', vi: 'Bộ phim đó làm mọi người cười.' },
      { ko: '실패가 저를 더 강하게 만들었어요.', vi: 'Thất bại khiến tôi mạnh mẽ hơn.' },
    ],
    commonMistake: 'Không dùng như mệnh lệnh “hãy làm”; đây là cấu trúc gây tác động/kết quả.',
  },
  {
    id: 'g4-gi-maryeonida',
    level: 4,
    title: '-기 마련이다',
    formula: 'V/A-기 마련이다',
    meaningVi: 'Thường/đương nhiên sẽ xảy ra như vậy.',
    meaningEn: 'It is natural/inevitable that.',
    examples: [
      { ko: '노력하면 실력이 늘기 마련이에요.', vi: 'Nếu nỗ lực thì năng lực thường sẽ tăng.' },
      { ko: '처음에는 누구나 실수하기 마련이에요.', vi: 'Ban đầu ai cũng thường mắc lỗi.' },
    ],
    commonMistake: 'Không dùng cho sự kiện ngẫu nhiên hiếm gặp; nó nói về quy luật/tính tất yếu.',
  },
  {
    id: 'g4-neun-ji-alda',
    level: 4,
    title: '-는지 알다',
    formula: 'V-는지 / A-(으)ㄴ지 알다/모르다',
    meaningVi: 'Biết/không biết liệu, rằng, cái gì/khi nào/ở đâu...',
    meaningEn: 'Know/do not know whether, what, when, where, etc.',
    examples: [
      { ko: '회의가 몇 시에 시작하는지 알아요?', vi: 'Bạn biết cuộc họp bắt đầu lúc mấy giờ không?' },
      { ko: '그 사람이 왜 화났는지 몰라요.', vi: 'Tôi không biết vì sao người đó giận.' },
    ],
    commonMistake: 'Không nhầm với -을 줄 알다 khi nói biết cách làm một kỹ năng.',
  },
  {
    id: 'g4-eul-geot-gatda',
    level: 4,
    title: '-을/ㄹ 것 같다',
    formula: 'V/A-(으)ㄹ 것 같다',
    meaningVi: 'Có vẻ/chắc là; diễn tả suy đoán mềm.',
    meaningEn: 'Seems/probably; a soft guess.',
    examples: [
      { ko: '내일 비가 올 것 같아요.', vi: 'Có vẻ ngày mai trời sẽ mưa.' },
      { ko: '이 문제가 어려울 것 같아요.', vi: 'Bài này có vẻ khó.' },
    ],
    commonMistake: 'Không dùng như sự thật chắc chắn tuyệt đối; nó là suy đoán.',
  },
  {
    id: 'g5-neun-han',
    level: 5,
    title: '-는 한',
    formula: 'V-는 한 / A-(으)ㄴ 한',
    meaningVi: 'Miễn là/trong phạm vi điều kiện còn đúng.',
    meaningEn: 'As long as; insofar as.',
    examples: [
      { ko: '노력하는 한 좋은 결과가 있을 거예요.', vi: 'Miễn là còn nỗ lực thì sẽ có kết quả tốt.' },
      { ko: '건강한 한 계속 일하고 싶어요.', vi: 'Miễn là còn khỏe, tôi muốn tiếp tục làm việc.' },
    ],
    commonMistake: 'Không nhầm với -기만 하면. -는 한 nhấn mạnh điều kiện duy trì lâu hơn.',
  },
  {
    id: 'g5-eul-tende',
    level: 5,
    title: '-을 텐데',
    formula: 'V/A-(으)ㄹ 텐데',
    meaningVi: 'Chắc là/sẽ... nên; diễn tả suy đoán kèm lo lắng hoặc gợi ý.',
    meaningEn: 'Would probably; used with expectation, concern, or suggestion.',
    examples: [
      { ko: '길이 막힐 텐데 일찍 출발하세요.', vi: 'Đường chắc sẽ tắc nên hãy xuất phát sớm.' },
      { ko: '피곤할 텐데 좀 쉬세요.', vi: 'Chắc bạn mệt rồi, nghỉ chút đi.' },
    ],
    commonMistake: 'Không dùng như một kết luận chắc chắn tuyệt đối; nó mang sắc thái suy đoán.',
  },
  {
    id: 'g5-eul-bbeonhada',
    level: 5,
    title: '-을/ㄹ 뻔하다',
    formula: 'V-(으)ㄹ 뻔하다',
    meaningVi: 'Suýt nữa thì làm gì/xảy ra chuyện gì.',
    meaningEn: 'Almost did; nearly happened.',
    examples: [
      { ko: '버스를 놓칠 뻔했어요.', vi: 'Tôi suýt lỡ xe buýt.' },
      { ko: '계단에서 넘어질 뻔했어요.', vi: 'Tôi suýt ngã ở cầu thang.' },
    ],
    commonMistake: 'Thường dùng với tình huống không xảy ra thật; nếu đã xảy ra thì dùng cấu trúc khác.',
  },
  {
    id: 'g5-neun-tong-e',
    level: 5,
    title: '-는 통에',
    formula: 'V-는 통에',
    meaningVi: 'Vì một việc rối/ồn/khó chịu xảy ra nên dẫn tới kết quả không tốt.',
    meaningEn: 'Because of a disruptive event, leading to a negative result.',
    examples: [
      { ko: '아이가 우는 통에 잠을 못 잤어요.', vi: 'Vì em bé khóc ầm lên nên tôi không ngủ được.' },
      { ko: '공사하는 통에 길이 막혔어요.', vi: 'Vì đang thi công nên đường bị tắc.' },
    ],
    commonMistake: 'Không dùng cho nguyên nhân tích cực hoặc trang trọng trung tính.',
  },
  {
    id: 'g5-eul-su-rok',
    level: 5,
    title: '-을/ㄹ수록',
    formula: 'V/A-(으)ㄹ수록',
    meaningVi: 'Càng... càng...',
    meaningEn: 'The more..., the more...',
    examples: [
      { ko: '공부할수록 한국어가 재미있어요.', vi: 'Càng học tiếng Hàn càng thú vị.' },
      { ko: '생각할수록 어려운 문제예요.', vi: 'Càng nghĩ càng thấy đó là vấn đề khó.' },
    ],
    commonMistake: 'Không tách sai thành -을 수 록; viết liền -을수록.',
  },
  {
    id: 'g5-gi-nareumida',
    level: 5,
    title: '-기 나름이다',
    formula: 'V-기 나름이다',
    meaningVi: 'Tùy vào cách làm/việc làm thế nào.',
    meaningEn: 'It depends on how one does it.',
    examples: [
      { ko: '성공은 노력하기 나름이에요.', vi: 'Thành công tùy vào việc nỗ lực thế nào.' },
      { ko: '시간은 쓰기 나름이에요.', vi: 'Thời gian tùy vào cách sử dụng.' },
    ],
    commonMistake: 'Không dùng với danh từ trực tiếp nếu không biến thành hành động bằng -기.',
  },
  {
    id: 'g5-daga-bomyeon',
    level: 5,
    title: '-다가 보면',
    formula: 'V-다가 보면',
    meaningVi: 'Nếu cứ tiếp tục làm thì sẽ dần thấy/xảy ra.',
    meaningEn: 'If one keeps doing, eventually something happens/is realized.',
    examples: [
      { ko: '매일 듣다가 보면 자연스럽게 들릴 거예요.', vi: 'Nếu nghe mỗi ngày thì dần sẽ nghe tự nhiên hơn.' },
      { ko: '살다가 보면 힘든 날도 있어요.', vi: 'Sống thì rồi cũng có ngày khó khăn.' },
    ],
    commonMistake: 'Không dùng cho hành động chỉ xảy ra một lần ngắn ngủi.',
  },
  {
    id: 'g5-neun-tasi',
    level: 5,
    title: '-는 탓에',
    formula: 'V-는 탓에 / N 탓에',
    meaningVi: 'Do lỗi/tại vì; nguyên nhân mang sắc thái tiêu cực.',
    meaningEn: 'Due to; because of, usually negative/blaming.',
    examples: [
      { ko: '준비가 부족한 탓에 시험을 망쳤어요.', vi: 'Do chuẩn bị thiếu nên tôi làm hỏng bài thi.' },
      { ko: '비가 많이 오는 탓에 길이 막혔어요.', vi: 'Do mưa nhiều nên đường tắc.' },
    ],
    commonMistake: 'Không dùng cho nguyên nhân tích cực; nếu trung tính dùng 때문에.',
  },
  {
    id: 'g6-eul-mangjeong',
    level: 6,
    title: '-을 망정',
    formula: 'V/A-(으)ㄹ 망정',
    meaningVi: 'Dù có... thì cũng không/nhưng vẫn; nhấn mạnh lựa chọn hoặc nhượng bộ mạnh.',
    meaningEn: 'Even if; rather than; emphatic concession.',
    examples: [
      { ko: '힘들 망정 포기하지 않겠습니다.', vi: 'Dù có vất vả tôi cũng sẽ không bỏ cuộc.' },
      { ko: '늦을 망정 거짓말은 하지 마세요.', vi: 'Dù có muộn cũng đừng nói dối.' },
    ],
    commonMistake: 'Mẫu này trang trọng, không hợp hội thoại đời thường quá đơn giản.',
  },
  {
    id: 'g6-neun-dungi-maneun-dungi',
    level: 6,
    title: '-는 둥 마는 둥',
    formula: 'V-는 둥 마는 둥',
    meaningVi: 'Làm qua loa, làm như có như không.',
    meaningEn: 'To do something half-heartedly or barely.',
    examples: [
      { ko: '아침을 먹는 둥 마는 둥 하고 나왔어요.', vi: 'Tôi ăn sáng qua loa rồi ra ngoài.' },
      { ko: '그는 대답하는 둥 마는 둥 했어요.', vi: 'Anh ấy trả lời hờ hững như có như không.' },
    ],
    commonMistake: 'Không dùng cho hành động làm cẩn thận hoặc hoàn thành đầy đủ.',
  },
  {
    id: 'g6-eul-bareya',
    level: 6,
    title: '-을/ㄹ 바에야',
    formula: 'V-(으)ㄹ 바에야',
    meaningVi: 'Thà... còn hơn; nếu phải làm điều đó thì chọn phương án khác.',
    meaningEn: 'Rather than doing; if one has to do that, better to do another.',
    examples: [
      { ko: '포기할 바에야 한 번 더 도전하겠어요.', vi: 'Thà thử thêm lần nữa còn hơn bỏ cuộc.' },
      { ko: '거짓말을 할 바에야 차라리 사실을 말하세요.', vi: 'Thà nói sự thật còn hơn nói dối.' },
    ],
    commonMistake: 'Thường đi với 차라리/오히려 để nhấn mạnh lựa chọn thay thế.',
  },
  {
    id: 'g6-geonman',
    level: 6,
    title: '-건만',
    formula: 'V/A-건만',
    meaningVi: 'Dù... nhưng; nhượng bộ trang trọng, kết quả trái kỳ vọng.',
    meaningEn: 'Although; formal concession with an unexpected contrast.',
    examples: [
      { ko: '열심히 준비했건만 결과가 좋지 않았어요.', vi: 'Dù đã chuẩn bị chăm chỉ nhưng kết quả không tốt.' },
      { ko: '여러 번 설명했건만 아직 이해하지 못했어요.', vi: 'Dù đã giải thích nhiều lần nhưng vẫn chưa hiểu.' },
    ],
    commonMistake: 'Mẫu này khá văn viết/trang trọng, không tự nhiên trong hội thoại rất thân mật.',
  },
  {
    id: 'g6-neun-semida',
    level: 6,
    title: '-는 셈이다',
    formula: 'V-는 셈이다 / A-(으)ㄴ 셈이다',
    meaningVi: 'Coi như/gần như là; đánh giá theo kết quả thực tế.',
    meaningEn: 'It amounts to; can be considered as.',
    examples: [
      { ko: '매일 연습했으니 거의 준비가 된 셈이에요.', vi: 'Vì luyện mỗi ngày nên coi như gần chuẩn bị xong.' },
      { ko: '반값에 샀으니 싸게 산 셈이에요.', vi: 'Mua nửa giá nên coi như mua rẻ.' },
    ],
    commonMistake: 'Không dùng để nói sự thật trực tiếp; nó là cách quy đổi/đánh giá.',
  },
  {
    id: 'g6-gi-ssangida',
    level: 6,
    title: '-기 십상이다',
    formula: 'V-기 십상이다',
    meaningVi: 'Dễ có khả năng xảy ra kết quả xấu nếu làm vậy.',
    meaningEn: 'Be likely to, usually for an undesirable result.',
    examples: [
      { ko: '준비 없이 시작하면 실패하기 십상이에요.', vi: 'Nếu bắt đầu không chuẩn bị thì rất dễ thất bại.' },
      { ko: '밤을 새우면 실수하기 십상이에요.', vi: 'Nếu thức trắng đêm thì dễ mắc lỗi.' },
    ],
    commonMistake: 'Thường dùng cho kết quả tiêu cực, không dùng cho kết quả tốt một cách tự nhiên.',
  },
  {
    id: 'g6-eun-nameoji',
    level: 6,
    title: '-은/ㄴ 나머지',
    formula: 'A/V-(으)ㄴ 나머지',
    meaningVi: 'Vì quá... nên; cảm xúc/trạng thái quá mức dẫn tới kết quả.',
    meaningEn: 'So much that; excessive state leading to a result.',
    examples: [
      { ko: '너무 긴장한 나머지 말을 잊어버렸어요.', vi: 'Vì quá căng thẳng nên tôi quên lời.' },
      { ko: '기쁜 나머지 눈물이 났어요.', vi: 'Vì quá vui nên tôi rơi nước mắt.' },
    ],
    commonMistake: 'Không dùng cho nguyên nhân bình thường; cần sắc thái quá mức.',
  },
  {
    id: 'g6-eul-riga-eopda',
    level: 6,
    title: '-을/ㄹ 리가 없다',
    formula: 'V/A-(으)ㄹ 리가 없다',
    meaningVi: 'Không đời nào/không có lý nào lại như vậy.',
    meaningEn: 'There is no way that; cannot possibly.',
    examples: [
      { ko: '그 사람이 거짓말을 할 리가 없어요.', vi: 'Người đó không đời nào nói dối.' },
      { ko: '이렇게 쉬운 문제가 틀릴 리가 없어요.', vi: 'Không thể nào sai câu dễ thế này được.' },
    ],
    commonMistake: 'Mẫu này thể hiện niềm tin mạnh của người nói, không phải phủ định khách quan đơn giản.',
  },
]

export const TOPIK_PRACTICE_QUESTIONS: TopikPracticeQuestion[] = [
  {
    id: 'q-go-sipda-1',
    level: 1,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g1-go-sipda',
    prompt: '한국어를 ____.',
    options: ['배우고 싶어요', '배우러 싶어요', '배우기 전에', '배우는 바람에'],
    answerIndex: 0,
    explanation: 'Muốn làm gì dùng V-고 싶다: 배우고 싶어요.',
  },
  {
    id: 'q-euro-1',
    level: 1,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g1-euro-gada',
    prompt: '저는 밥을 ____ 식당에 가요.',
    options: ['먹고 싶어서', '먹으러', '먹기 전에', '먹는 한'],
    answerIndex: 1,
    explanation: 'Đi đến đâu để làm gì dùng V-(으)러 가다.',
  },
  {
    id: 'q-eumyeon-1',
    level: 2,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g2-eumyeon',
    prompt: '시간이 ____ 같이 공부합시다.',
    options: ['있으면', '있기 전에', '있는 바람에', '있는 둥 마는 둥'],
    answerIndex: 0,
    explanation: 'Điều kiện “nếu có thời gian” dùng A/V-(으)면.',
  },
  {
    id: 'q-gie-jeone-1',
    level: 2,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g2-gie-jeone',
    prompt: '시험을 ____ 단어를 복습하세요.',
    options: ['보기 전에', '봤기 전에', '보는 한', '볼 망정'],
    answerIndex: 0,
    explanation: 'Trước khi làm gì dùng V-기 전에, động từ không chia thì.',
  },
  {
    id: 'q-baram-1',
    level: 3,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g3-neun-baram-e',
    prompt: '비가 많이 ____ 약속이 취소됐어요.',
    options: ['오는 바람에', '오도록', '올 뿐만 아니라', '오는 한'],
    answerIndex: 0,
    explanation: '-는 바람에 hợp với nguyên nhân bất ngờ dẫn tới kết quả không mong muốn.',
  },
  {
    id: 'q-dorok-1',
    level: 3,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g3-dorok',
    prompt: '모두 들을 수 ____ 크게 말해 주세요.',
    options: ['있도록', '있는 바람에', '있기 전에', '있는 둥 마는 둥'],
    answerIndex: 0,
    explanation: 'Mục tiêu “để mọi người nghe được” dùng -도록.',
  },
  {
    id: 'q-banhae-1',
    level: 4,
    category: 'grammar',
    errorType: 'similar_meaning',
    patternId: 'g4-neun-dae-banhae',
    prompt: '형은 조용한 ____ 동생은 활발해요.',
    options: ['데 반해', '뿐만 아니라', '바람에', '전에'],
    answerIndex: 0,
    explanation: 'Hai vế đối lập “anh trầm, em năng động” dùng -는 데 반해.',
  },
  {
    id: 'q-bbun-1',
    level: 4,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g4-eul-bbunman-anira',
    prompt: '그는 한국어____ 영어도 잘해요.',
    options: ['뿐만 아니라', '는 한', '는 둥 마는 둥', '기 전에'],
    answerIndex: 0,
    explanation: 'Không chỉ tiếng Hàn mà còn tiếng Anh: N뿐만 아니라.',
  },
  {
    id: 'q-neun-han-1',
    level: 5,
    category: 'grammar',
    errorType: 'similar_meaning',
    patternId: 'g5-neun-han',
    prompt: '노력하는 ____ 좋은 결과가 있을 거예요.',
    options: ['한', '바람에', '전에', '둥 마는 둥'],
    answerIndex: 0,
    explanation: 'Miễn là còn nỗ lực: V-는 한.',
  },
  {
    id: 'q-tende-1',
    level: 5,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g5-eul-tende',
    prompt: '길이 막힐 ____ 일찍 출발하세요.',
    options: ['텐데', '망정', '뿐만 아니라', '도록'],
    answerIndex: 0,
    explanation: 'Suy đoán kèm lời khuyên: -(으)ㄹ 텐데.',
  },
  {
    id: 'q-mangjeong-1',
    level: 6,
    category: 'grammar',
    errorType: 'grammar_connector',
    patternId: 'g6-eul-mangjeong',
    prompt: '힘들 ____ 포기하지 않겠습니다.',
    options: ['망정', '텐데', '전에', '도록'],
    answerIndex: 0,
    explanation: 'Dù có vất vả cũng không bỏ cuộc: -(으)ㄹ 망정.',
  },
  {
    id: 'q-dung-1',
    level: 6,
    category: 'grammar',
    errorType: 'similar_meaning',
    patternId: 'g6-neun-dungi-maneun-dungi',
    prompt: '아침을 먹는 ____ 하고 나왔어요.',
    options: ['둥 마는 둥', '데 반해', '뿐만 아니라', '한'],
    answerIndex: 0,
    explanation: 'Làm qua loa như có như không: -는 둥 마는 둥.',
  },
  {
    id: 'q-vocab-cha-byeol',
    level: 6,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '차별',
    options: ['Phân biệt đối xử', 'Thỏa hiệp', 'Dự báo', 'Tập trung'],
    answerIndex: 0,
    explanation: '차별 nghĩa là sự phân biệt đối xử.',
  },
  {
    id: 'q-vocab-gachi',
    level: 4,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'similar_meaning',
    prompt: '가치관',
    options: ['Quan niệm giá trị', 'Kế hoạch du lịch', 'Phí sinh hoạt', 'Thời tiết'],
    answerIndex: 0,
    explanation: '가치관 là quan niệm/hệ giá trị.',
  },
  {
    id: 'q-honorific-1',
    level: 2,
    gameType: 'topik-master',
    category: 'grammar',
    errorType: 'honorific',
    prompt: 'Câu nào dùng kính ngữ tự nhiên nhất khi nói với giáo viên?',
    options: ['선생님, 어디 가?', '선생님, 어디 가세요?', '선생님, 어디 갔어?', '선생님, 어디야?'],
    answerIndex: 1,
    explanation: 'Với giáo viên nên dùng đuôi kính ngữ -세요.',
  },
  {
    id: 'q-reading-1',
    level: 3,
    gameType: 'topik-master',
    category: 'reading',
    errorType: 'reading',
    prompt: '“비가 와서 행사가 취소되었습니다.” Ý chính là gì?',
    options: ['Sự kiện bị hủy vì trời mưa', 'Sự kiện được tổ chức ngoài trời', 'Trời mưa sau sự kiện', 'Sự kiện bị hoãn vì tắc đường'],
    answerIndex: 0,
    explanation: '취소되다 là bị hủy, nguyên nhân là 비가 와서.',
  },
  {
    id: 'q-sentence-1',
    level: 2,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu ghép đúng: “Trước khi ngủ, tôi đọc sách.”',
    options: ['자기 전에 책을 읽어요.', '자고 전에 책을 읽어요.', '자기 바람에 책을 읽어요.', '자는 한 책을 읽어요.'],
    answerIndex: 0,
    explanation: 'Trước khi làm gì dùng V-기 전에.',
  },
  {
    id: 'q-sentence-2',
    level: 3,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu tự nhiên nhất: “Hãy nói to để mọi người nghe được.”',
    options: ['모두 들을 수 있도록 크게 말하세요.', '모두 듣는 바람에 크게 말하세요.', '모두 듣기 전에 크게 말하세요.', '모두 듣는 한 크게 말하세요.'],
    answerIndex: 0,
    explanation: 'Mục tiêu/kết quả mong muốn dùng -도록.',
  },
]

export function getGrammarByLevel(level: number) {
  return TOPIK_GRAMMAR_PATTERNS.filter(pattern => pattern.level === level)
}

export function getPracticeQuestions(level: number, patternId?: string) {
  const pool = TOPIK_PRACTICE_QUESTIONS.filter(question => {
    if (patternId) return question.patternId === patternId
    return question.level === level
  })
  return pool.length ? pool : TOPIK_PRACTICE_QUESTIONS.filter(question => question.level === level)
}

export function pickPracticeSession(level: number, patternId?: string, count = 5) {
  const pool = getPracticeQuestions(level, patternId)
  const sameLevel = TOPIK_PRACTICE_QUESTIONS.filter(question => question.level === level)
  const fallback = TOPIK_PRACTICE_QUESTIONS.filter(question => question.category === 'grammar')
  const seen = new Set<string>()
  const merged = [...pool, ...sameLevel, ...fallback].filter(question => {
    if (seen.has(question.id)) return false
    seen.add(question.id)
    return true
  })
  return merged
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}
