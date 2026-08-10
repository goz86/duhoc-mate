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

const CORE_TOPIK_GRAMMAR_PATTERNS: TopikGrammarPattern[] = [
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

const EXTRA_TOPIK_GRAMMAR_PATTERNS: TopikGrammarPattern[] = [
  {
    id: 'g1-께서-께서는',
    level: 1,
    title: 'N + 께서, 께서는',
    formula: 'N + 께서/께서는',
    meaningVi: 'Dạng kính ngữ của 이/가, 은/는',
    meaningEn: 'Honorific subject/topic marker',
    examples: [
      { ko: '선생님께서 한국어를 가르치세요.', vi: 'Cô giáo dạy tiếng Hàn.' }
    ],
    commonMistake: 'Dùng kính ngữ 께서 đi kèm với động từ kính ngữ 시/으시.',
  },
  {
    id: 'g1-은-는-n2-은-는',
    level: 1,
    title: 'N1 + 은/는 ... N2 + 은/는',
    formula: 'N1 은/는 ... N2 은/는',
    meaningVi: 'Tiểu từ biểu hiện ý nghĩa đối chiếu',
    meaningEn: 'Contrastive topic markers',
    examples: [
      { ko: '사과는 비싸요. 오렌지는 싸요.', vi: 'Táo thì đắt. Cam thì rẻ.' }
    ],
    commonMistake: 'Dùng khi đối chiếu 2 đối tượng có đặc điểm trái ngược.',
  },
  {
    id: 'g1-에-위치',
    level: 1,
    title: 'N + 에 (위치)',
    formula: 'N + 에',
    meaningVi: 'Tiểu từ chỉ địa điểm (ở, tại)',
    meaningEn: 'Static location marker',
    examples: [
      { ko: '저는 집에 있어요.', vi: 'Tôi ở nhà.' }
    ],
    commonMistake: 'Chỉ đi với động từ tồn tại như 있다/없다/살다, không đi với động từ hành động.',
  },
  {
    id: 'g1-에-목적지',
    level: 1,
    title: 'N + 에 (목적지)',
    formula: 'N + 에',
    meaningVi: 'Tiểu từ chỉ đích đến (đến)',
    meaningEn: 'Destination marker',
    examples: [
      { ko: '학교에 가요.', vi: 'Tôi đi đến trường.' }
    ],
    commonMistake: 'Đi với các động từ di chuyển: 가다, 오다, 다니다, 도착하다.',
  },
  {
    id: 'g1-에-시간',
    level: 1,
    title: 'N + 에 (시간)',
    formula: 'N + 에',
    meaningVi: 'Tiểu từ chỉ thời gian (lúc, vào lúc)',
    meaningEn: 'Time marker',
    examples: [
      { ko: '저는 아침 7시에 일어나요.', vi: 'Tôi thức dậy vào lúc 7 giờ sáng.' }
    ],
    commonMistake: 'Không gắn 에 sau 그저께, 어제, 오늘, 내일, 모레.',
  },
  {
    id: 'g1-으-로',
    level: 1,
    title: 'N + (으)로',
    formula: 'N + (으)로',
    meaningVi: 'Bằng (nguyên liệu, dụng cụ, phương tiện)',
    meaningEn: 'Method / means / instrument marker',
    examples: [
      { ko: '버스로 학교에 가요.', vi: 'Tôi đến trường bằng xe buýt.' }
    ],
    commonMistake: 'Danh từ kết thúc bằng ㄹ hoặc không chim dùng 로, có chim dùng 으로.',
  },
  {
    id: 'g1-와-과-하고-n2',
    level: 1,
    title: 'N1 + 와/과/하고 + N2',
    formula: 'N1 와/과/하고/이랑 N2',
    meaningVi: 'Và / cùng với',
    meaningEn: 'And / with',
    examples: [
      { ko: '빵하고 우유를 먹어요.', vi: 'Tôi ăn bánh mì và sữa.' }
    ],
    commonMistake: '하고 dùng phổ biến trong giao tiếp; 와/과 dùng trong văn viết.',
  },
  {
    id: 'g1-도',
    level: 1,
    title: 'N + 도',
    formula: 'N + 도',
    meaningVi: 'Cũng',
    meaningEn: 'Also / too',
    examples: [
      { ko: '저도 학생입니다.', vi: 'Tôi cũng là học sinh.' }
    ],
    commonMistake: 'Thay thế cho 이/가, 은/는, 을/를; không dùng chồng đè lên nhau.',
  },
  {
    id: 'g1-에게-한테-께',
    level: 1,
    title: 'N + 에게, 한테, 께',
    formula: 'N + 에게/한테/께',
    meaningVi: 'Cho (làm gì cho ai / hướng tới ai)',
    meaningEn: 'To / for (person)',
    examples: [
      { ko: '친구에게 선물을 줘요.', vi: 'Tôi tặng quà cho bạn.' }
    ],
    commonMistake: '께 dùng cho người lớn tuổi/kính ngữ; 한테 dùng nói chuyện thân mật; 에게 dùng văn viết.',
  },
  {
    id: 'g1-입니다',
    level: 1,
    title: 'N + 입니다',
    formula: 'N + 입니다',
    meaningVi: 'Là (câu trần thuật trang trọng)',
    meaningEn: 'Is/am/are (formal standard)',
    examples: [
      { ko: '저는 베트남 사람입니다.', vi: 'Tôi là người Việt Nam.' }
    ],
    commonMistake: 'Viết liền vào danh từ đứng trước, không cách.',
  },
  {
    id: 'g1-입니까',
    level: 1,
    title: 'N + 입니까?',
    formula: 'N + 입니까?',
    meaningVi: 'Có phải là...? (câu hỏi trang trọng)',
    meaningEn: 'Is/are it...? (formal question)',
    examples: [
      { ko: '학생입니까?', vi: 'Có phải bạn là học sinh không?' }
    ],
    commonMistake: 'Dạng nghi vấn tương ứng của N입니다.',
  },
  {
    id: 'g1-이-가아닙니다',
    level: 1,
    title: 'N + 이/가 아닙니다',
    formula: 'N + 이/가 아닙니다',
    meaningVi: 'Không phải là (phủ định của 입니다)',
    meaningEn: 'Is not (formal)',
    examples: [
      { ko: '저는 의사가 아닙니다.', vi: 'Tôi không phải là bác sĩ.' }
    ],
    commonMistake: 'Phải có tiểu từ 이/가 sau danh từ trước 아닙니다.',
  },
  {
    id: 'g1-예요-이에요',
    level: 1,
    title: 'N + 예요/이에요',
    formula: 'N + 예요/이에요',
    meaningVi: 'Là (câu trần thuật thân mật lịch sự)',
    meaningEn: 'Is/am/are (polite informal)',
    examples: [
      { ko: '이거는 책이에요.', vi: 'Cái này là sách.' }
    ],
    commonMistake: 'Danh từ có chim + 이에요, không chim + 예요.',
  },
  {
    id: 'g1-이-가아니에요',
    level: 1,
    title: 'N + 이/가 아니에요',
    formula: 'N + 이/가 아니에요',
    meaningVi: 'Không phải là (dạng thân mật lịch sự)',
    meaningEn: 'Is not (polite informal)',
    examples: [
      { ko: '저것은 제 가방이 아니에요.', vi: 'Cái kia không phải là cặp của tôi.' }
    ],
    commonMistake: 'Phủ định dạng thân mật của 이에요/예요.',
  },
  {
    id: 'g1-습니다',
    level: 1,
    title: 'V/A + -ㅂ/습니다',
    formula: 'V/A + -ㅂ/습니다',
    meaningVi: 'Đuôi câu trần thuật trang trọng',
    meaningEn: 'Formal polite ending',
    examples: [
      { ko: '저는 갑니다.', vi: 'Tôi đi.' }
    ],
    commonMistake: 'Không chim dùng -ㅂ니다, có chim dùng -습니다.',
  },
  {
    id: 'g1-습니까',
    level: 1,
    title: 'V/A + -ㅂ/습니까?',
    formula: 'V/A + -ㅂ/습니까?',
    meaningVi: 'Đuôi câu hỏi trang trọng',
    meaningEn: 'Formal polite question ending',
    examples: [
      { ko: '어디에 갑니까?', vi: 'Bạn đi đâu vậy?' }
    ],
    commonMistake: 'Không chim dùng -ㅂ니까, có chim dùng -습니까.',
  },
  {
    id: 'g1-아-어요',
    level: 1,
    title: 'V/A + 아/어요',
    formula: 'V/A + 아/어요',
    meaningVi: 'Đuôi câu trần thuật / hỏi thân mật lịch sự',
    meaningEn: 'Polite informal ending',
    examples: [
      { ko: '지금 뭐 해요?', vi: 'Bây giờ bạn làm gì?' }
    ],
    commonMistake: 'Nguyên âm ㅏ, ㅗ chia 아요; các nguyên âm còn lại chia 어요; 하다 chia 해요.',
  },
  {
    id: 'g1-았-었다',
    level: 1,
    title: 'V/A + 았/었다',
    formula: 'V/A + 았/었어요',
    meaningVi: 'Thì quá khứ (đã...)',
    meaningEn: 'Past tense',
    examples: [
      { ko: '어제 영화를 봤어요.', vi: 'Hôm qua tôi đã xem phim.' }
    ],
    commonMistake: 'ㅏ/ㅗ chia 았어요; các nguyên âm khác chia 었어요; 하다 chia 했어요.',
  },
  {
    id: 'g1-겠다',
    level: 1,
    title: 'V/A + 겠다',
    formula: 'V/A + 겠습니다/겠어요',
    meaningVi: 'Thì tương lai / ý định / phỏng đoán',
    meaningEn: 'Future tense / intention',
    examples: [
      { ko: '내일 시험을 보겠습니다.', vi: 'Ngày mai tôi sẽ thi.' }
    ],
    commonMistake: 'Dùng thể hiện quyết tâm trang trọng hoặc phỏng đoán hiện tại.',
  },
  {
    id: 'g1-으-시다',
    level: 1,
    title: 'V/A + (으)시다',
    formula: 'V/A + (으)시-',
    meaningVi: 'Kính ngữ hóa động từ, tính từ',
    meaningEn: 'Honorific verb suffix',
    examples: [
      { ko: '선생님께서 오십니다.', vi: 'Thầy giáo đang đến.' }
    ],
    commonMistake: 'Dùng khi nói về hành động của người lớn tuổi/cấp trên.',
  },
  {
    id: 'g1-으-세요-으-십시오',
    level: 1,
    title: 'V + (으)세요 / (으)십시오',
    formula: 'V + (으)세요',
    meaningVi: 'Câu yêu cầu lịch sự (hãy, mời)',
    meaningEn: 'Polite imperative',
    examples: [
      { ko: '여기에 앉으세요.', vi: 'Mời ngồi ở đây.' }
    ],
    commonMistake: 'Không dùng cho tính từ.',
  },
  {
    id: 'g1-으-려고하다',
    level: 1,
    title: 'V + (으)려고 하다',
    formula: 'V + (으)려고 하다',
    meaningVi: 'Định làm gì (dự định)',
    meaningEn: 'Plan to do something',
    examples: [
      { ko: '주말에 친구를 만나려고 해요.', vi: 'Tôi định cuối tuần gặp bạn.' }
    ],
    commonMistake: 'Không dùng thì quá khứ ở vế (으)려고; chỉ chia quá khứ ở 하다.',
  },
  {
    id: 'g1-으-러가다-오다',
    level: 1,
    title: 'V + (으)러 가다/오다',
    formula: 'V + (으)러 가다/오다',
    meaningVi: 'Đi/đến để làm gì (mục đích di chuyển)',
    meaningEn: 'Go/come to do something',
    examples: [
      { ko: '한국어를 배우러 한국에 왔어요.', vi: 'Tôi đến Hàn Quốc để học tiếng Hàn.' }
    ],
    commonMistake: 'Động từ phía sau phải là động từ di chuyển (가다, 오다, 다니다).',
  },
  {
    id: 'g1-으-시다',
    level: 1,
    title: 'V + (으)ㅂ시다',
    formula: 'V + (으)ㅂ시다',
    meaningVi: 'Câu rủ rê ngang hàng hoặc thấp hơn (hãy... đi)',
    meaningEn: 'Let us do something',
    examples: [
      { ko: '같이 갑시다.', vi: 'Chúng ta cùng đi nào.' }
    ],
    commonMistake: 'Không dùng rủ rê người lớn tuổi hơn mình.',
  },
  {
    id: 'g1-으-까요',
    level: 1,
    title: 'V + (으)ㄹ까요?',
    formula: 'V + (으)ㄹ까요?',
    meaningVi: 'Hỏi ý kiến, đề nghị (nhé, nhỉ, nha?)',
    meaningEn: 'Shall we...? / Should I...?',
    examples: [
      { ko: '우리 영화 볼까요?', vi: 'Chúng ta xem phim nhé?' }
    ],
    commonMistake: 'Chủ ngữ 1 người = hỏi ý kiến; chủ ngữ nhóm = đề nghị cùng làm.',
  },
  {
    id: 'g1-으-래요',
    level: 1,
    title: 'V + (으)ㄹ래요?',
    formula: 'V + (으)ㄹ래요?',
    meaningVi: 'Thể hiện ý định, đề nghị thân mật (nhé?)',
    meaningEn: 'Would you like to...?',
    examples: [
      { ko: '커피 한잔 할래요?', vi: 'Uống một tách cà phê nhé?' }
    ],
    commonMistake: 'Chỉ dùng trong giao tiếp thân mật.',
  },
  {
    id: 'g1-으-수있다-없다',
    level: 1,
    title: 'V + (으)ㄹ 수 있다/없다',
    formula: 'V + (으)ㄹ 수 있다/없다',
    meaningVi: 'Có thể / không thể làm gì',
    meaningEn: 'Can / cannot do something',
    examples: [
      { ko: '저는 김치를 만들 수 있어요.', vi: 'Tôi có thể làm kim chi.' }
    ],
    commonMistake: 'Thường bị nhầm với 못 V; (으)ㄹ 수 없다 nhấn mạnh khả năng điều kiện.',
  },
  {
    id: 'g1-으-거예요',
    level: 1,
    title: 'V/A + (으)ㄹ 거예요',
    formula: 'V/A + (으)ㄹ 거예요',
    meaningVi: 'Sẽ làm gì / dự đoán tương lai',
    meaningEn: 'Will / going to',
    examples: [
      { ko: '내일 비가 올 거예요.', vi: 'Ngày mai trời sẽ mưa.' }
    ],
    commonMistake: 'Chủ ngữ ngôi 1 = dự định; ngôi 3 = phỏng đoán.',
  },
  {
    id: 'g1-아-어서-nguy-nnh-n',
    level: 1,
    title: 'V/A + 아/어서 (nguyên nhân)',
    formula: 'V/A + 아/어서',
    meaningVi: 'Vì... nên... (nguyên nhân tự nhiên)',
    meaningEn: 'Because / so',
    examples: [
      { ko: '배가 아파서 병원에 갔어요.', vi: 'Vì đau bụng nên tôi đã đến bệnh viện.' }
    ],
    commonMistake: 'Không đi với câu mệnh lệnh/rủ rê ở vế sau.',
  },
  {
    id: 'g1-지만',
    level: 1,
    title: 'V/A + 지만',
    formula: 'V/A + 지만',
    meaningVi: 'Nhưng (nối 2 vế đối lập)',
    meaningEn: 'But / although',
    examples: [
      { ko: '한국어는 어렵지만 재미있어요.', vi: 'Tiếng Hàn khó nhưng thú vị.' }
    ],
    commonMistake: 'Có thể chia thì quá khứ 았/었지만 ở vế trước.',
  },
  {
    id: 'g1-고싶다',
    level: 1,
    title: 'V + 고 싶다',
    formula: 'V + 고 싶다',
    meaningVi: 'Muốn làm gì',
    meaningEn: 'Want to do something',
    examples: [
      { ko: '영화를 보고 싶어요.', vi: 'Tôi muốn xem phim.' }
    ],
    commonMistake: 'Ngôi thứ 3 dùng 고 싶어 하다.',
  },
  {
    id: 'g1-고-v',
    level: 1,
    title: 'V + 고 + V',
    formula: 'V1 + 고 + V2',
    meaningVi: 'Làm gì rồi làm gì (trình tự)',
    meaningEn: 'And then',
    examples: [
      { ko: '아침을 먹고 학교에 가요.', vi: 'Tôi ăn sáng rồi đến trường.' }
    ],
    commonMistake: 'Khác với 아/어서, 2 hành động vế -고 không nhất thiết có quan hệ nguyên nhân.',
  },
  {
    id: 'g1-안-v-a',
    level: 1,
    title: '안 + V/A',
    formula: '안 + V/A',
    meaningVi: 'Phủ định ngắn (không...)',
    meaningEn: 'Not (short negative)',
    examples: [
      { ko: '오늘 학교에 안 가요.', vi: 'Hôm nay tôi không đến trường.' }
    ],
    commonMistake: 'Động từ dạng N하다 đặt 안 trước 하다 (공부 안 하다).',
  },
  {
    id: 'g1-지않다',
    level: 1,
    title: 'V/A + 지 않다',
    formula: 'V/A + 지 않다',
    meaningVi: 'Phủ định dài (không...)',
    meaningEn: 'Not (long negative)',
    examples: [
      { ko: '저는 그 사람을 만나지 않아요.', vi: 'Tôi không gặp người đó.' }
    ],
    commonMistake: 'Trang trọng và tự nhiên hơn trong văn viết so với 안.',
  },
  {
    id: 'g1-못-v',
    level: 1,
    title: '못 + V',
    formula: '못 + V',
    meaningVi: 'Không thể làm gì (do hoàn cảnh/năng lực)',
    meaningEn: 'Cannot (short negative)',
    examples: [
      { ko: '바빠서 못 갔어요.', vi: 'Vì bận nên tôi đã không thể đi.' }
    ],
    commonMistake: 'Không dùng cho tính từ.',
  },
  {
    id: 'g1-부터-n-까지',
    level: 1,
    title: 'N + 부터 ~ N + 까지',
    formula: 'N1 부터 N2 까지',
    meaningVi: 'Từ... đến... (thời gian / địa điểm)',
    meaningEn: 'From... to...',
    examples: [
      { ko: '9시부터 5시까지 일해요.', vi: 'Tôi làm việc từ 9 giờ đến 5 giờ.' }
    ],
    commonMistake: 'Địa điểm thường dùng 에서 ~ 까지.',
  },
  {
    id: 'g1-이-나-선택',
    level: 1,
    title: 'N + (이)나 (선택)',
    formula: 'N + (이)나',
    meaningVi: 'Hoặc (lựa chọn)',
    meaningEn: 'Or',
    examples: [
      { ko: '커피나 주스를 주세요.', vi: 'Cho tôi cà phê hoặc nước ép.' }
    ],
    commonMistake: 'Có chim + 이나, không chim + 나.',
  },
  {
    id: 'g1-이-나-수량',
    level: 1,
    title: 'N + (이)나 (수량)',
    formula: 'N + (이)나',
    meaningVi: 'Tới, tận, những (nhấn mạnh số lượng nhiều)',
    meaningEn: 'As many as / up to',
    examples: [
      { ko: '어제 10시간이나 잤어요.', vi: 'Hôm qua tôi đã ngủ tới 10 tiếng.' }
    ],
    commonMistake: 'Diễn tả sự ngạc nhiên vì số lượng vượt mức kỳ vọng.',
  },
  {
    id: 'g1-만',
    level: 1,
    title: 'N + 만',
    formula: 'N + 만',
    meaningVi: 'Chỉ',
    meaningEn: 'Only / just',
    examples: [
      { ko: '오늘만 쉬어요.', vi: 'Tôi chỉ nghỉ hôm nay thôi.' }
    ],
    commonMistake: 'Thay thế cho 이/가, 을/를; gắn đằng sau trợ từ 에, 에서.',
  },
  {
    id: 'g1-보다-더',
    level: 1,
    title: 'N + 보다 (더)',
    formula: 'N + 보다 (더)',
    meaningVi: 'So sánh hơn (hơn...)',
    meaningEn: 'More than',
    examples: [
      { ko: '수박이 사과보다 더 커요.', vi: 'Dưa hấu to hơn táo.' }
    ],
    commonMistake: 'Danh từ gắn 보다 là danh từ làm mốc so sánh.',
  },
  {
    id: 'g1-에서-한테서',
    level: 1,
    title: 'N + 에서/한테서',
    formula: 'N + 에서/한테서',
    meaningVi: 'Từ (ai đó / nguồn gốc)',
    meaningEn: 'From (someone)',
    examples: [
      { ko: '친구에게서 편지를 받았어요.', vi: 'Tôi đã nhận được thư từ bạn.' }
    ],
    commonMistake: '한테서 dùng trong giao tiếp; 에게서/에서 dùng trong văn viết.',
  },
  {
    id: 'g1-으-n',
    level: 1,
    title: 'A + (으)ㄴ N',
    formula: 'A + (으)ㄴ N',
    meaningVi: 'Định ngữ của tính từ',
    meaningEn: 'Adjective modifier',
    examples: [
      { ko: '예쁜 옷을 사고 싶어요.', vi: 'Tôi muốn mua chiếc áo đẹp.' }
    ],
    commonMistake: 'Tính từ kết thúc bằng 있다/없다 chia dạng -는 (재미있는).',
  },
  {
    id: 'g1-는n',
    level: 1,
    title: 'V + 는 N',
    formula: 'V + 는 N',
    meaningVi: 'Định ngữ của động từ (hiện tại)',
    meaningEn: 'Present verb modifier',
    examples: [
      { ko: '지금 읽는 책이 재미있어요.', vi: 'Cuốn sách tôi đang đọc rất thú vị.' }
    ],
    commonMistake: 'Tất cả động từ thì hiện tại đều dùng -는.',
  },
  {
    id: 'g1-으-n',
    level: 1,
    title: 'V + (으)ㄹ N',
    formula: 'V + (으)ㄹ N',
    meaningVi: 'Định ngữ của động từ (tương lai / dự định)',
    meaningEn: 'Future verb modifier',
    examples: [
      { ko: '내일 만날 사람을 기다려요.', vi: 'Tôi đang đợi người mà tôi sẽ gặp vào ngày mai.' }
    ],
    commonMistake: 'Diễn tả hành động chưa xảy ra.',
  },
  {
    id: 'g2-거나',
    level: 2,
    title: 'V/A + 거나',
    formula: 'V/A + 거나',
    meaningVi: 'Hoặc',
    meaningEn: 'Or',
    examples: [
      { ko: '주말에 영화를 보거나 책을 읽어요.', vi: 'Cuối tuần tôi xem phim hoặc đọc sách.' }
    ],
    commonMistake: 'Dùng cho động từ/tính từ, khác với (이)나 dùng cho danh từ.',
  },
  {
    id: 'g2-으-니까',
    level: 2,
    title: 'V/A + (으)니까',
    formula: 'V/A + (으)니까',
    meaningVi: 'Vì... nên... (dùng được cho câu mệnh lệnh, đề nghị)',
    meaningEn: 'Because / so (allows imperative/propositive)',
    examples: [
      { ko: '비가 오니까 우산을 가져가세요.', vi: 'Vì trời mưa nên hãy mang theo ô.' }
    ],
    commonMistake: 'Vế sau có thể dùng câu rủ rê (으)ㅂ시다 hoặc mệnh lệnh (으)세요.',
  },
  {
    id: 'g1-으-면',
    level: 1,
    title: 'V/A + (으)면',
    formula: 'V/A + (으)면',
    meaningVi: 'Nếu... thì...',
    meaningEn: 'If / when',
    examples: [
      { ko: '돈이 많으면 집을 살 거예요.', vi: 'Nếu có nhiều tiền tôi sẽ mua nhà.' }
    ],
    commonMistake: 'Có chim dùng 으면, không chim/kết thúc bằng ㄹ dùng 면.',
  },
  {
    id: 'g2-으-면좋겠다',
    level: 2,
    title: 'V + (으)면 좋겠다',
    formula: 'V + (으)면 좋겠다',
    meaningVi: 'Ước gì, nếu... thì tốt',
    meaningEn: 'I wish that / it would be nice if',
    examples: [
      { ko: '한국에 가면 좋겠어요.', vi: 'Nếu được đến Hàn Quốc thì tốt biết mấy.' }
    ],
    commonMistake: 'Dùng thể hiện mong muốn chưa thành hiện thực.',
  },
  {
    id: 'g2-으-면서',
    level: 2,
    title: 'V + (으)면서',
    formula: 'V + (으)면서',
    meaningVi: 'Vừa... vừa... (hai hành động song song)',
    meaningEn: 'While / at the same time',
    examples: [
      { ko: '음악을 들으면서 공부해요.', vi: 'Tôi vừa nghe nhạc vừa học bài.' }
    ],
    commonMistake: 'Chủ ngữ ở 2 vế phải là một người.',
  },
  {
    id: 'g2-으-면안되다',
    level: 2,
    title: 'V/A + (으)면 안 되다',
    formula: 'V/A + (으)면 안 되다',
    meaningVi: 'Không được làm gì (cấm đoán)',
    meaningEn: 'Must not / not allowed to',
    examples: [
      { ko: '교실에서 담배를 피우면 안 돼요.', vi: 'Không được hút thuốc trong lớp học.' }
    ],
    commonMistake: 'Diễn tả sự cấm đoán hoặc quy định.',
  },
  {
    id: 'g2-으-려고',
    level: 2,
    title: 'V + (으)려고',
    formula: 'V + (으)려고',
    meaningVi: 'Định, để làm gì (mục đích)',
    meaningEn: 'In order to / intending to',
    examples: [
      { ko: '살을 빼려고 운동을 해요.', vi: 'Tôi tập thể dục để giảm cân.' }
    ],
    commonMistake: 'Khác với (으)러, vế 2 (으)려고 có thể đi với bất kỳ động từ nào.',
  },
  {
    id: 'g1-으-때',
    level: 1,
    title: 'V/A + (으)ㄹ 때',
    formula: 'V/A + (으)ㄹ 때',
    meaningVi: 'Khi',
    meaningEn: 'When / at the time of',
    examples: [
      { ko: '공부할 때 조용히 하세요.', vi: 'Hãy yên lặng khi học bài.' }
    ],
    commonMistake: 'Không dùng với các từ thời gian cố định như 어제, 오늘.',
  },
  {
    id: 'g2-으-게요',
    level: 2,
    title: 'V + (으)ㄹ게요',
    formula: 'V + (으)ㄹ게요',
    meaningVi: 'Sẽ (hứa hẹn, ý chí của người nói)',
    meaningEn: 'I will (promise/intent to listener)',
    examples: [
      { ko: '제가 도와줄게요.', vi: 'Để tôi giúp cho.' }
    ],
    commonMistake: 'Chỉ dùng cho chủ ngữ ngôi thứ 1 (tôi/chúng tôi).',
  },
  {
    id: 'g2-으-것같다',
    level: 2,
    title: 'V/A + (으)ㄹ 것 같다',
    formula: 'V/A + (으)ㄹ 것 같다',
    meaningVi: 'Hình như, có vẻ (phỏng đoán tương lai/hiện tại)',
    meaningEn: 'It seems like / I think',
    examples: [
      { ko: '비가 올 것 같아요.', vi: 'Hình như trời sắp mưa.' }
    ],
    commonMistake: 'Diễn tả phỏng đoán chủ quan nhẹ nhàng.',
  },
  {
    id: 'g2-으-후에',
    level: 2,
    title: 'V + (으)ㄴ 후에',
    formula: 'V + (으)ㄴ 후에',
    meaningVi: 'Sau khi',
    meaningEn: 'After doing',
    examples: [
      { ko: '밥을 먹은 후에 약을 드세요.', vi: 'Hãy uống thuốc sau khi ăn cơm.' }
    ],
    commonMistake: 'Tương đương với -고 나서.',
  },
  {
    id: 'g2-으-적이있다-없다',
    level: 2,
    title: 'V + (으)ㄴ 적이 있다/없다',
    formula: 'V + (으)ㄴ 적이 있다/없다',
    meaningVi: 'Đã từng / chưa từng (kinh nghiệm)',
    meaningEn: 'Have / have not experienced',
    examples: [
      { ko: '제주도에 가 본 적이 있어요.', vi: 'Tôi đã từng đi đảo Jeju.' }
    ],
    commonMistake: 'Thường kết hợp dạng V아/어 본 적이 있다.',
  },
  {
    id: 'g2-으-지-th-igian-되다',
    level: 2,
    title: 'V + (으)ㄴ 지 (Thời gian) 되다',
    formula: 'V + (으)ㄴ 지 되다',
    meaningVi: 'Được bao lâu kể từ khi...',
    meaningEn: 'It has been [time] since...',
    examples: [
      { ko: '한국에 온 지 1년이 되었어요.', vi: 'Tôi đến Hàn Quốc đã được 1 năm.' }
    ],
    commonMistake: 'Khoảng cách chữ: (으)ㄴ cách 지 cách thời gian.',
  },
  {
    id: 'g2-는데-으-데',
    level: 2,
    title: 'V/A + 는데/(으)ㄴ데',
    formula: 'V/A + 는데/(으)ㄴ데',
    meaningVi: 'Nhưng, mà (tạo bối cảnh vế sau)',
    meaningEn: 'But / background context',
    examples: [
      { ko: '날씨가 좋은데 공원에 갈까요?', vi: 'Thời tiết đẹp, chúng ta ra công viên nhé?' }
    ],
    commonMistake: 'Dùng đưa ra lý do, bối cảnh cho câu hỏi/đề nghị.',
  },
  {
    id: 'g1-아-어야하다-되다',
    level: 1,
    title: 'V + 아/어야 하다/되다',
    formula: 'V + 아/어야 하다/되다',
    meaningVi: 'Phải làm gì (bắt buộc)',
    meaningEn: 'Must / have to do',
    examples: [
      { ko: '내일 시험이 있어서 공부해야 해요.', vi: 'Vì ngày mai có bài kiểm tra nên tôi phải học.' }
    ],
    commonMistake: '되다 thân mật thông dụng; 하다 trang trọng văn viết.',
  },
  {
    id: 'g1-아-어보다',
    level: 1,
    title: 'V + 아/어 보다',
    formula: 'V + 아/어 보다',
    meaningVi: 'Thử làm gì (thử nghiệm/trải nghiệm)',
    meaningEn: 'Try doing something',
    examples: [
      { ko: '이 옷을 한번 입어 보세요.', vi: 'Hãy mặc thử chiếc áo này xem.' }
    ],
    commonMistake: 'Thì quá khứ 아/어 봤다 = đã từng trải nghiệm.',
  },
  {
    id: 'g2-아-어도되다-좋다-괜찮다',
    level: 2,
    title: 'V + 아/어도 되다/좋다/괜찮다',
    formula: 'V + 아/어도 되다',
    meaningVi: 'Được phép làm gì (cho phép)',
    meaningEn: 'May / allowed to do',
    examples: [
      { ko: '여기에 앉아도 돼요?', vi: 'Tôi ngồi đây có được không?' }
    ],
    commonMistake: 'Dạng câu hỏi xin phép lịch sự.',
  },
  {
    id: 'g1-아-어주다-드리다',
    level: 1,
    title: 'V + 아/어 주다/드리다',
    formula: 'V + 아/어 주다',
    meaningVi: 'Làm gì cho ai đó (giúp đỡ)',
    meaningEn: 'Do something for someone',
    examples: [
      { ko: '문 좀 열어 주세요.', vi: 'Làm ơn mở cửa giúp tôi.' }
    ],
    commonMistake: '드리다 là dạng kính ngữ của 주다 khi làm cho người lớn.',
  },
  {
    id: 'g1-아-어서-tr-nht',
    level: 1,
    title: 'V + 아/어서 (trình tự)',
    formula: 'V + 아/어서',
    meaningVi: '...rồi... (chỉ trình tự thời gian gắn kết)',
    meaningEn: 'And then (sequential action)',
    examples: [
      { ko: '친구를 만나서 영화를 봤어요.', vi: 'Tôi gặp bạn rồi đi xem phim.' }
    ],
    commonMistake: 'Khác với -고, hai hành động vế -아서/어서 có liên quan mật thiết về địa điểm/mục đích.',
  },
  {
    id: 'g2-겠-ph-ng-o-n',
    level: 2,
    title: 'V/A + 겠- (phỏng đoán)',
    formula: 'V/A + 겠-',
    meaningVi: 'Chắc là, có lẽ (phỏng đoán)',
    meaningEn: 'Must be / seems like',
    examples: [
      { ko: '음식이 맛있겠어요.', vi: 'Món ăn này chắc là ngon lắm.' }
    ],
    commonMistake: 'Diễn tả cảm nhận trực quan phỏng đoán tức thì.',
  },
  {
    id: 'g2-네요',
    level: 2,
    title: 'V/A + -네요',
    formula: 'V/A + -네요',
    meaningVi: '...thật đấy! (cảm thán trực tiếp)',
    meaningEn: 'Exclamation ending (surprise)',
    examples: [
      { ko: '한국말을 정말 잘하시네요!', vi: 'Bạn nói tiếng Hàn giỏi thật đấy!' }
    ],
    commonMistake: 'Bày tỏ sự ngạc nhiên khi trực tiếp chứng kiến.',
  },
  {
    id: 'g1-지말다',
    level: 1,
    title: 'V + -지 말다',
    formula: 'V + -지 말다',
    meaningVi: 'Đừng làm gì (cấm đoán lịch sự)',
    meaningEn: 'Do not do...',
    examples: [
      { ko: '걱정하지 마세요.', vi: 'Đừng lo lắng.' }
    ],
    commonMistake: 'Thường dùng dạng 지 마세요 / 지 마십시오.',
  },
  {
    id: 'g2-지못하다',
    level: 2,
    title: 'V + 지 못하다',
    formula: 'V + 지 못하다',
    meaningVi: 'Không thể làm gì (do năng lực/hoàn cảnh)',
    meaningEn: 'Cannot do (long negative)',
    examples: [
      { ko: '저는 수영을 하지 못해요.', vi: 'Tôi không thể bơi.' }
    ],
    commonMistake: 'Dạng dài tương ứng của 못 V.',
  },
  {
    id: 'g2-지요',
    level: 2,
    title: 'V/A + -지요?',
    formula: 'V/A + -지요?',
    meaningVi: '...phải không? (xác nhận lại)',
    meaningEn: 'Right? / Isn’t it?',
    examples: [
      { ko: '오늘 날씨가 춥지요?', vi: 'Thời tiết hôm nay lạnh phải không?' }
    ],
    commonMistake: 'Thân mật thường nói rút gọn thành -죠?',
  },
  {
    id: 'g1-고있다',
    level: 1,
    title: 'V + -고 있다',
    formula: 'V + -고 있다',
    meaningVi: 'Đang... (tiếp diễn)',
    meaningEn: 'Am/is/are doing (progressive)',
    examples: [
      { ko: '지금 음악을 듣고 있어요.', vi: 'Bây giờ tôi đang nghe nhạc.' }
    ],
    commonMistake: 'Nhấn mạnh hành động đang xảy ra tại thời điểm nói.',
  },
  {
    id: 'g2-아-어지다',
    level: 2,
    title: 'A + -아/어지다',
    formula: 'A + -아/어지다',
    meaningVi: 'Trở nên... (chuyển biến tính chất)',
    meaningEn: 'Become / turn into',
    examples: [
      { ko: '날씨가 따뜻해졌어요.', vi: 'Thời tiết đã trở nên ấm áp.' }
    ],
    commonMistake: 'Biến tính từ thành động từ chỉ sự thay đổi.',
  },
  {
    id: 'g2-대신-에',
    level: 2,
    title: 'N + 대신(에)',
    formula: 'N + 대신(에)',
    meaningVi: 'Thay vì, thay cho',
    meaningEn: 'Instead of',
    examples: [
      { ko: '커피 대신에 차를 마실래요.', vi: 'Tôi sẽ uống trà thay cho cà phê.' }
    ],
    commonMistake: 'Động từ dùng V는 대신에.',
  },
  {
    id: 'g2-대로',
    level: 2,
    title: 'N + 대로',
    formula: 'N + 대로',
    meaningVi: 'Theo, như',
    meaningEn: 'As / according to',
    examples: [
      { ko: '계획대로 하세요.', vi: 'Hãy làm theo kế hoạch.' }
    ],
    commonMistake: 'Gắn trực tiếp sau danh từ.',
  },
  {
    id: 'g2-으-생각이다',
    level: 2,
    title: 'V + (으)ㄹ 생각이다',
    formula: 'V + (으)ㄹ 생각이다',
    meaningVi: 'Định, có ý định',
    meaningEn: 'Plan to / think of doing',
    examples: [
      { ko: '이번 주말에 등산을 갈 생각이에요.', vi: 'Tôi định đi leo núi vào cuối tuần này.' }
    ],
    commonMistake: 'Diễn tả kế hoạch mang tính cá nhân.',
  },
  {
    id: 'g2-으-줄알다-모르다',
    level: 2,
    title: 'V + (으)ㄹ 줄 알다/모르다',
    formula: 'V + (으)ㄹ 줄 알다/모르다',
    meaningVi: 'Biết / không biết làm gì (kỹ năng)',
    meaningEn: 'Know / don’t know how to do',
    examples: [
      { ko: '저는 운전할 줄 알아요.', vi: 'Tôi biết lái xe.' }
    ],
    commonMistake: 'Chỉ khả năng thực hiện một kỹ năng do học tập.',
  },
  {
    id: 'g2-v-n-으-덕분에',
    level: 2,
    title: 'V/N + (으)ㄴ 덕분에',
    formula: 'V + (으)ㄴ 덕분에 / N 덕분에',
    meaningVi: 'Nhờ vào, nhờ có (kết quả tốt)',
    meaningEn: 'Thanks to',
    examples: [
      { ko: '선생님 덕분에 한국어를 잘하게 되었어요.', vi: 'Nhờ có cô giáo mà tôi đã giỏi tiếng Hàn.' }
    ],
    commonMistake: 'Chỉ dùng cho nguyên nhân dẫn đến kết quả tích cực.',
  },
  {
    id: 'g3-으',
    level: 3,
    title: 'V/A + (으)ㅁ',
    formula: 'V/A + (으)ㅁ',
    meaningVi: 'Danh từ hóa động từ/tính từ',
    meaningEn: 'Nominalizer suffix',
    examples: [
      { ko: '그의 죽음은 모두를 슬프게 했다.', vi: 'Cái chết của anh ấy đã làm mọi người đau buồn.' }
    ],
    commonMistake: 'Dùng trong thông báo văn bản viết trang trọng.',
  },
  {
    id: 'g2-으-려면',
    level: 2,
    title: 'V + (으)려면',
    formula: 'V + (으)려면',
    meaningVi: 'Nếu muốn / nếu có ý định... thì...',
    meaningEn: 'If you want to do X...',
    examples: [
      { ko: '한국어를 잘하려면 매일 공부해야 해요.', vi: 'Nếu muốn giỏi tiếng Hàn thì phải học mỗi ngày.' }
    ],
    commonMistake: 'Vế 2 thường đi với câu dặn dò (으)세요, 아/어야 해요.',
  },
  {
    id: 'g2-아-어보인다',
    level: 2,
    title: 'V/A + 아/어 보인다',
    formula: 'V/A + 아/어 보인다',
    meaningVi: 'Trông có vẻ (cảm nhận qua thị giác)',
    meaningEn: 'Looks like / appears to be',
    examples: [
      { ko: '그 사람은 피곤해 보조여요.', vi: 'Người đó trông có vẻ mệt mỏi.' }
    ],
    commonMistake: 'Dựa vào dáng vẻ bên ngoài để phỏng đoán.',
  },
  {
    id: 'g2-았-었으면좋겠다',
    level: 2,
    title: 'V/A + 았/었으면 좋겠다',
    formula: 'V/A + 았/었으면 좋겠다',
    meaningVi: 'Ước gì, giá mà',
    meaningEn: 'I wish that / hope that',
    examples: [
      { ko: '시험에 합격했으면 좋겠어요.', vi: 'Giá mà tôi thi đỗi.' }
    ],
    commonMistake: 'Đi với quá khứ 았/었 thể hiện ước muốn thiết tha.',
  },
  {
    id: 'g2-거든-요',
    level: 2,
    title: 'V/A + 거든(요)',
    formula: 'V/A + 거든(요)',
    meaningVi: 'Vì, do... (giải thích lý do ở vế sau)',
    meaningEn: 'Because / you see (explaining reason)',
    examples: [
      { ko: '어제는 피곤했거든요. 그래서 일찍 잤어요.', vi: 'Hôm qua tôi mệt. Vì vậy tôi đã đi ngủ sớm.' }
    ],
    commonMistake: 'Dùng trong giao tiếp khi người nghe chưa biết lý do.',
  },
  {
    id: 'g2-게되다',
    level: 2,
    title: 'V/A + 게 되다',
    formula: 'V/A + 게 되다',
    meaningVi: 'Được, bị, trở nên (kết quả do tác động bên ngoài)',
    meaningEn: 'Turn out to be / end up doing',
    examples: [
      { ko: '내년부터 한국에서 일하게 되었어요.', vi: 'Tôi sẽ được làm việc ở Hàn Quốc từ năm sau.' }
    ],
    commonMistake: 'Diễn tả sự thay đổi không hoàn toàn do ý chí chủ quan.',
  },
  {
    id: 'g3-기는하다',
    level: 3,
    title: 'V/A + 기는 하다',
    formula: 'V/A + 기는 하다',
    meaningVi: '...thì cũng... nhưng mà...',
    meaningEn: 'It is true that... but',
    examples: [
      { ko: '가기는 하겠지만 오래 있지는 않을 거예요.', vi: 'Đi thì cũng đi nhưng tôi sẽ không ở lại lâu.' }
    ],
    commonMistake: 'Thừa nhận vế trước nhưng bổ sung hạn chế ở vế sau.',
  },
  {
    id: 'g2-기쉽다-어렵다',
    level: 2,
    title: 'V + 기 쉽다/어렵다',
    formula: 'V + 기 쉽다/어렵다',
    meaningVi: 'Dễ / khó làm gì',
    meaningEn: 'Easy / difficult to do',
    examples: [
      { ko: '이 문제는 풀기 쉬워요.', vi: 'Vấn đề này dễ giải quyết.' }
    ],
    commonMistake: 'Khác với (으)ㄹ 수 있다, chỉ mức độ thuận lợi.',
  },
  {
    id: 'g2-고나서',
    level: 2,
    title: 'V + 고 나서',
    formula: 'V + 고 나서',
    meaningVi: 'Sau khi... thì... (trình tự rõ ràng)',
    meaningEn: 'After finishing X, do Y',
    examples: [
      { ko: '숙제를 하고 나서 텔레비전을 봤어요.', vi: 'Sau khi làm bài tập xong thì tôi đã xem tivi.' }
    ],
    commonMistake: 'Nhấn mạnh hành động 1 phải hoàn tất xong hoàn toàn mới làm 2.',
  },
  {
    id: 'g2-는길이다-는길에',
    level: 2,
    title: 'V + 는 길이다/는 길에',
    formula: 'V + 는 길이다/는 길에',
    meaningVi: 'Đang trên đường...',
    meaningEn: 'On the way to...',
    examples: [
      { ko: '지금 집에 가는 길이에요.', vi: 'Tôi đang trên đường về nhà.' }
    ],
    commonMistake: 'Chỉ đi với động từ di chuyển 가다/오다.',
  },
  {
    id: 'g2-는-으-것같다',
    level: 2,
    title: 'V/A + 는/(으)ㄴ 것 같다',
    formula: 'V/A + 는/(으)ㄴ 것 같다',
    meaningVi: 'Hình như, có vẻ (hiện tại / quá khứ)',
    meaningEn: 'It seems that...',
    examples: [
      { ko: '밖에서 이상한 소리가 나는 것 같아요.', vi: 'Hình như có tiếng động lạ ở bên ngoài.' }
    ],
    commonMistake: 'Động từ hiện tại dùng -는 것 같다.',
  },
  {
    id: 'g2-는게좋다',
    level: 2,
    title: 'V + 는 게 좋다',
    formula: 'V + 는 게 좋다',
    meaningVi: '...thì tốt (lời khuyên)',
    meaningEn: 'It is better to...',
    examples: [
      { ko: '감기에 걸렸을 때는 푹 쉬는 게 좋아요.', vi: 'Khi bị cảm, nghỉ ngơi thật nhiều thì tốt.' }
    ],
    commonMistake: 'Khuyên bảo nhẹ nhàng.',
  },
  {
    id: 'g3-는-으-대신에',
    level: 3,
    title: 'V/A + 는/(으)ㄴ 대신에',
    formula: 'V/A + 는/(으)ㄴ 대신에',
    meaningVi: 'Thay vì, bù lại',
    meaningEn: 'Instead of / to compensate for',
    examples: [
      { ko: '영화를 보는 대신에 집에서 책을 읽었어요.', vi: 'Thay vì xem phim, tôi đã ở nhà đọc sách.' }
    ],
    commonMistake: 'Có thể dùng thể hiện bù trừ tính chất.',
  },
  {
    id: 'g2-는동안',
    level: 2,
    title: 'V + 는 동안',
    formula: 'V + 는 동안',
    meaningVi: 'Trong lúc, trong khi',
    meaningEn: 'While / during',
    examples: [
      { ko: '여행하는 동안 사진을 많이 찍었어요.', vi: 'Tôi đã chụp nhiều ảnh trong khi đi du lịch.' }
    ],
    commonMistake: 'Chủ ngữ 2 vế có thể giống hoặc khác nhau.',
  },
  {
    id: 'g2-는중이다',
    level: 2,
    title: 'V + 는 중이다',
    formula: 'V + 는 중이다',
    meaningVi: 'Đang trong quá trình...',
    meaningEn: 'In the middle of doing',
    examples: [
      { ko: '지금 회의 중입니다.', vi: 'Bây giờ đang trong cuộc họp.' }
    ],
    commonMistake: 'Không dùng cho tính từ.',
  },
  {
    id: 'g3-곤하다',
    level: 3,
    title: 'V + 곤 하다',
    formula: 'V-곤 하다',
    meaningVi: 'Thường... (thói quen lặp đi lặp lại)',
    meaningEn: 'Used to / make it a rule to',
    examples: [
      { ko: '주말에는 보통 영화를 보곤 했어요.', vi: 'Cuối tuần tôi thường xem phim.' }
    ],
    commonMistake: 'Thường chia ở quá khứ 곤 했다.',
  },
  {
    id: 'g3-자마자',
    level: 3,
    title: 'V + 자마자',
    formula: 'V-자마자',
    meaningVi: 'Ngay khi... (hành động tiếp nối tức thì)',
    meaningEn: 'As soon as',
    examples: [
      { ko: '집에 오자마자 잤어요.', vi: 'Ngay khi về đến nhà tôi đã ngủ.' }
    ],
    commonMistake: 'Vế 1 không chia thì quá khứ.',
  },
  {
    id: 'g3-잖아요',
    level: 3,
    title: 'V/A + 잖아요',
    formula: 'V/A-잖아요',
    meaningVi: '...còn gì, ...mà (nhắc lại điều cả 2 cùng biết)',
    meaningEn: 'As you know / isn’t it?',
    examples: [
      { ko: '어제 말했잖아요.', vi: 'Hôm qua tôi đã nói rồi còn gì.' }
    ],
    commonMistake: 'Dùng trong giao tiếp nói.',
  },
  {
    id: 'g4-얼마나v-a-는지-으-지모르다',
    level: 4,
    title: '얼마나 V/A + 는지/(으)ㄴ지 모르다',
    formula: '얼마나 V/A-는지/(으)ㄴ지 모르다',
    meaningVi: '...biết bao nhiêu (nhấn mạnh mức độ)',
    meaningEn: 'You don’t know how much...',
    examples: [
      { ko: '그 소식을 듣고 얼마나 기뻤는지 몰라요.', vi: 'Nghe tin đó tôi đã vui biết bao nhiêu.' }
    ],
    commonMistake: 'Bày tỏ cảm xúc mãnh liệt.',
  },
  {
    id: 'g3-나보다-으-가보다',
    level: 3,
    title: 'V/A + 나 보다/(으)ㄴ가 보다',
    formula: 'V/A-나 보다/(으)ㄴ가 보다',
    meaningVi: 'Có vẻ, hình như (phỏng đoán phán đoán)',
    meaningEn: 'It seems that',
    examples: [
      { ko: '그 사람이 인기가 많은가 봐요.', vi: 'Người đó có vẻ nổi tiếng.' }
    ],
    commonMistake: 'Động từ dùng -나 보다; tính từ dùng -(으)ㄴ가 보다.',
  },
  {
    id: 'g3-는-으-척하다',
    level: 3,
    title: 'V/A + 는/(으)ㄴ 척하다',
    formula: 'V/A-는/(으)ㄴ 척하다',
    meaningVi: 'Giả vờ... (tỏ ra như thể)',
    meaningEn: 'Pretend to be / do',
    examples: [
      { ko: '자는 척했어요.', vi: 'Tôi đã giả vờ ngủ.' }
    ],
    commonMistake: 'Giả vờ trạng thái không đúng sự thật.',
  },
  {
    id: 'g4-으-로인해',
    level: 4,
    title: 'N + (으)로 인해',
    formula: 'N-(으)로 인해',
    meaningVi: 'Do, bởi (nguyên nhân dẫn đến hậu quả)',
    meaningEn: 'Due to / caused by',
    examples: [
      { ko: '태풍으로 인해 많은 피해가 발생했다.', vi: 'Do bão nên đã xảy ra nhiều thiệt hại.' }
    ],
    commonMistake: 'Văn phong trang trọng nghị luận.',
  },
  {
    id: 'g4-으-로서',
    level: 4,
    title: 'N + (으)로서',
    formula: 'N-(으)로서',
    meaningVi: 'Với tư cách là (bản vị/vị thế)',
    meaningEn: 'As / in the capacity of',
    examples: [
      { ko: '저는 교사로서 학생들을 가르칩니다.', vi: 'Tôi dạy học sinh với tư cách là một giáo viên.' }
    ],
    commonMistake: 'Phân biệt với (으)로써 (bằng phương tiện/cách thức).',
  },
  {
    id: 'g4-으-로써',
    level: 4,
    title: 'N + (으)로써',
    formula: 'N-(으)로써',
    meaningVi: 'Bằng cách, bằng phương tiện',
    meaningEn: 'By means of / using',
    examples: [
      { ko: '대화로서 문제를 해결해야 합니다.', vi: 'Phải giải quyết vấn đề bằng cách đối thoại.' }
    ],
    commonMistake: 'Chỉ công cụ hoặc công thức giải quyết.',
  },
  {
    id: 'g3-이-라도',
    level: 3,
    title: 'N + (이)라도',
    formula: 'N-(이)라도',
    meaningVi: 'Dù là... (lựa chọn thứ yếu tạm chấp nhận)',
    meaningEn: 'At least / even if it is',
    examples: [
      { ko: '뭐라도 좀 먹어.', vi: 'Ăn chút gì đi, dù là bất cứ thứ gì.' }
    ],
    commonMistake: 'Chấp nhận phương án không hoàn hảo.',
  },
  {
    id: 'g3-으-뿐이다',
    level: 3,
    title: 'V/A + (으)ㄹ 뿐이다',
    formula: 'V/A-(으)ㄹ 뿐이다',
    meaningVi: 'Chỉ là... (không hơn không kém)',
    meaningEn: 'Only / merely',
    examples: [
      { ko: '제가 한 것은 작은 도움이었을 뿐입니다.', vi: 'Việc tôi làm chỉ là một sự giúp đỡ nhỏ thôi.' }
    ],
    commonMistake: 'Nhấn mạnh sự giới hạn.',
  },
  {
    id: 'g3-으-수밖에없다',
    level: 3,
    title: 'V/A + (으)ㄹ 수밖에 없다',
    formula: 'V/A-(으)ㄹ 수밖에 없다',
    meaningVi: 'Không còn cách nào khác ngoài...',
    meaningEn: 'Have no choice but to',
    examples: [
      { ko: '늦어서 택시를 탈 수밖에 없었어요.', vi: 'Vì muộn nên tôi không còn cách nào khác là phải đi taxi.' }
    ],
    commonMistake: 'Bắt buộc theo tình thế.',
  },
  {
    id: 'g4-으-채-로',
    level: 4,
    title: 'V + (으)ㄴ 채(로)',
    formula: 'V-(으)ㄴ 채(로)',
    meaningVi: 'Trong trạng thái... (duy trì trạng thái cũ)',
    meaningEn: 'With state kept as is',
    examples: [
      { ko: '안경을 쓴 채로 잠이 들었어요.', vi: 'Tôi đã ngủ thiếp đi trong khi vẫn đang đeo kính.' }
    ],
    commonMistake: 'Hành động vế 1 đã hoàn thành và giữ nguyên trạng thái.',
  },
  {
    id: 'g4-으-는만큼',
    level: 4,
    title: 'V/A + (으)ㄴ/는 만큼',
    formula: 'V/A-(으)ㄴ/는 만큼',
    meaningVi: 'Tương xứng với, đáng với (mức độ tương đương)',
    meaningEn: 'As much as / to the extent',
    examples: [
      { ko: '노력한 만큼 좋은 결과가 있을 거예요.', vi: 'Kết quả tốt sẽ tương xứng với nỗ lực của bạn.' }
    ],
    commonMistake: 'Tương xứng nguyên nhân kết quả.',
  },
  {
    id: 'g4-으-는법이다',
    level: 4,
    title: 'V + (으)ㄴ/는 법이다',
    formula: 'V-(으)ㄴ/는 법이다',
    meaningVi: 'Đương nhiên là... (quy luật tự nhiên)',
    meaningEn: 'It is natural that...',
    examples: [
      { ko: '사람은 누구나 실수를 하는 법이다.', vi: 'Con người ai cũng có lúc mắc sai lầm là chuyện đương nhiên.' }
    ],
    commonMistake: 'Quy luật chung mang tính hiển nhiên.',
  },
  {
    id: 'g4-으-는데도-불구하고',
    level: 4,
    title: 'V/A + (으)ㄴ/는데도 (불구하고)',
    formula: 'V/A-(으)ㄴ/는데도 (불구하고)',
    meaningVi: 'Mặc dù... nhưng... (bất chấp)',
    meaningEn: 'Despite / in spite of',
    examples: [
      { ko: '비가 오는데도 불구하고 축구를 했어요.', vi: 'Mặc dù trời mưa nhưng chúng tôi vẫn đá bóng.' }
    ],
    commonMistake: 'Nhấn mạnh sự bất chấp hoàn cảnh trái ngược.',
  },
  {
    id: 'g4-으-으로써',
    level: 4,
    title: 'V + (으)ㅁ으로써',
    formula: 'V-(으)ㅁ으로써',
    meaningVi: 'Bằng việc... (phương thức thực hiện)',
    meaningEn: 'By doing / through doing',
    examples: [
      { ko: '꾸준히 연습함으로써 실력을 늘 수 있다.', vi: 'Có thể nâng cao trình độ bằng việc luyện tập đều đặn.' }
    ],
    commonMistake: 'Văn phong trang trọng báo chí.',
  },
  {
    id: 'g3-으-면서도',
    level: 3,
    title: 'V/A + (으)면서도',
    formula: 'V/A-(으)면서도',
    meaningVi: 'Mặc dù... nhưng vẫn... (hai đặc tính trái ngược)',
    meaningEn: 'Even while / yet at same time',
    examples: [
      { ko: '그는 가난하면서도 항상 남을 도왔다.', vi: 'Anh ấy tuy nghèo nhưng vẫn luôn giúp đỡ người khác.' }
    ],
    commonMistake: 'Tồn tại song song hai vế mâu thuẫn.',
  },
  {
    id: 'g3-아-어버리다',
    level: 3,
    title: 'V + 아/어 버리다',
    formula: 'V-아/어 버리다',
    meaningVi: '...mất rồi (hành động kết thúc hoàn toàn / giải thoát / tiếc nuối)',
    meaningEn: 'Ended up doing / completely done',
    examples: [
      { ko: '약속을 잊어버렸어요.', vi: 'Tôi quên mất cuộc hẹn rồi.' }
    ],
    commonMistake: 'Có thể mang sắc thái nhẹ nhõm hoặc tiếc nuối.',
  },
  {
    id: 'g4-와-었던니',
    level: 4,
    title: 'V/A + 와/었던니',
    formula: 'V/A-았/었던니',
    meaningVi: '...thì thấy rằng... (kết quả sau trải nghiệm)',
    meaningEn: 'Did X and experienced Y',
    examples: [
      { ko: '그 약을 먹었더니 금방 나았어요.', vi: 'Tôi uống thuốc đó thì thấy khỏi ngay.' }
    ],
    commonMistake: 'Kinh nghiệm bản thân đã thực hiện.',
  },
  {
    id: 'g4-와-었던라면',
    level: 4,
    title: 'V/A + 와/었던라면',
    formula: 'V/A-았/었던라면',
    meaningVi: 'Nếu đã... thì... (giả định quá khứ trái thực tế)',
    meaningEn: 'If I had done X...',
    examples: [
      { ko: '그때 공부를 열심히 했더라면 시험에 합격했을 텐데.', vi: 'Nếu lúc đó tôi học chăm chỉ thì đã thi đỗi rồi.' }
    ],
    commonMistake: 'Tiếc nuối về quá khứ đã không xảy ra.',
  },
  {
    id: 'g4-게마련이다',
    level: 4,
    title: 'V/A + 게 마련이다',
    formula: 'V/A-게 마련이다',
    meaningVi: 'Đương nhiên, tất nhiên (quy luật tự nhiên)',
    meaningEn: 'Bound to happen',
    examples: [
      { ko: '겨울이 가면 봄이 오는 것은 당연한 게 마련이다.', vi: 'Mùa đông đi thì mùa xuân đến là chuyện đương nhiên.' }
    ],
    commonMistake: 'Tương đương với 는 법이다.',
  },
  {
    id: 'g4-고말다',
    level: 4,
    title: 'V + 고 말다',
    formula: 'V-고 말다',
    meaningVi: 'Cuối cùng thì... (kết quả đáng tiếc ngoài ý muốn)',
    meaningEn: 'Ended up doing (regret)',
    examples: [
      { ko: '결국 울고 말았어요.', vi: 'Cuối cùng thì tôi đã khóc.' }
    ],
    commonMistake: 'Thể hiện sự nuối tiếc kết quả ngẫu nhiên.',
  },
  {
    id: 'g4-기는커녕',
    level: 4,
    title: 'V/A + 기는커녕',
    formula: 'V/A-기는커녕',
    meaningVi: 'Nói gì đến... (ngay cả điều nhỏ hơn cũng không)',
    meaningEn: 'Far from / let alone',
    examples: [
      { ko: '밥은커녕 물도 못 마셨어요.', vi: 'Nói gì đến cơm, nước tôi còn chưa uống được.' }
    ],
    commonMistake: 'Vế 2 tiêu cực hơn vế 1.',
  },
  {
    id: 'g4-기나름이다',
    level: 4,
    title: 'V + 기 나름이다',
    formula: 'V-기 나름이다',
    meaningVi: 'Tùy thuộc vào...',
    meaningEn: 'Depends on how you do',
    examples: [
      { ko: '모든 것은 생각하기 나름이다.', vi: 'Mọi thứ đều tùy thuộc vào suy nghĩ.' }
    ],
    commonMistake: 'Tùy thuộc vào cách thức thực hiện.',
  },
  {
    id: 'g3-거든',
    level: 3,
    title: 'V/A + 거든',
    formula: 'V/A-거든',
    meaningVi: 'Nếu... thì... (điều kiện trong giao tiếp)',
    meaningEn: 'If (informal condition)',
    examples: [
      { ko: '도움이 필요하거든 언제든지 연락하세요.', vi: 'Nếu cần giúp đỡ thì hãy liên lạc bất cứ lúc nào.' }
    ],
    commonMistake: 'Vế sau là câu mệnh lệnh hoặc rủ rê.',
  },
  {
    id: 'g4-느니-차라리',
    level: 4,
    title: 'V + 느니 (차라리)',
    formula: 'V-느니 (차라리)',
    meaningVi: 'Thà... còn hơn là ("chi bằng")',
    meaningEn: 'Rather than doing X, I would Y',
    examples: [
      { ko: '이렇게 기다리느니 차라리 집에 가겠어요.', vi: 'Thà về nhà còn hơn là đợi như thế này.' }
    ],
    commonMistake: 'Cả 2 phương án đều tiêu cực nhưng chọn cái bớt tệ hơn.',
  },
  {
    id: 'g4-더니',
    level: 4,
    title: 'V/A + 더니',
    formula: 'V/A-더니',
    meaningVi: '...rồi... (sự thay đổi quan sát được ở người khác/sự vật)',
    meaningEn: 'Used to be X, but now Y',
    examples: [
      { ko: '아까는 덥더니 지금은 춥네요.', vi: 'Lúc nãy còn nóng mà giờ đã lạnh rồi.' }
    ],
    commonMistake: 'Không dùng cho chủ ngữ ngôi thứ 1 ở vế 1.',
  },
  {
    id: 'g4-는한',
    level: 4,
    title: 'V + 는 한',
    formula: 'V-는 한',
    meaningVi: 'Chừng nào mà... (điều kiện duy trì)',
    meaningEn: 'As long as',
    examples: [
      { ko: '네가 노력하는 한 나는 항상 응원할게.', vi: 'Chừng nào bạn còn nỗ lực, tôi sẽ luôn ủng hộ.' }
    ],
    commonMistake: 'Duy trì điều kiện ở vế 1.',
  },
  {
    id: 'g4-는통에',
    level: 4,
    title: 'V + 는 통에',
    formula: 'V-는 통에',
    meaningVi: 'Do, tại vì (hoàn cảnh hỗn loạn gây tiêu cực)',
    meaningEn: 'Because of the commotion of',
    examples: [
      { ko: '아이들이 떠드는 통에 잠을 잘 수가 없었어요.', vi: 'Tại bọn trẻ làm ồn nên tôi không thể ngủ được.' }
    ],
    commonMistake: 'Vế 1 thường là tiếng ồn hoặc sự ồn ào phức tạp.',
  },
  {
    id: 'g4-여간v-a-지않다',
    level: 4,
    title: '여간 V/A + 지 않다',
    formula: '여간 V/A-지 않다',
    meaningVi: '...biết bao, vô cùng (cực kỳ)',
    meaningEn: 'Extremely / non-ordinarily',
    examples: [
      { ko: '그 영화는 여간 재미있지 않아요.', vi: 'Bộ phim đó thú vị vô cùng.' }
    ],
    commonMistake: 'Mang nghĩa khẳng định cực kỳ dù có phủ định 지 않다.',
  },
  {
    id: 'g4-마저',
    level: 4,
    title: 'N + 마저',
    formula: 'N-마저',
    meaningVi: 'Ngay cả, đến cả (đối tượng cuối cùng còn lại)',
    meaningEn: 'Even (the last remaining)',
    examples: [
      { ko: '마지막 희망마저 사라졌다.', vi: 'Ngay cả hy vọng cuối cùng cũng biến mất.' }
    ],
    commonMistake: 'Thường mang nghĩa tiêu cực (đến cả cái cuối cùng cũng mất).',
  },
  {
    id: 'g5-으-로말미암아',
    level: 5,
    title: 'N + (으)로 말미암아',
    formula: 'N-(으)로 말미암아',
    meaningVi: 'Do, vì (nguyên nhân dẫn đến hậu quả nghiêm trọng)',
    meaningEn: 'Due to / owing to',
    examples: [
      { ko: '전쟁으로 말미암아 많은 사람들이 죽었다.', vi: 'Nhiều người đã chết do chiến tranh.' }
    ],
    commonMistake: 'Văn phong trang trọng báo chí.',
  },
  {
    id: 'g4-을-를비롯해서',
    level: 4,
    title: 'N + 을/를 비롯해서',
    formula: 'N-을/를 비롯해서',
    meaningVi: 'Bao gồm, kể cả (lấy làm đại diện tiêu biểu)',
    meaningEn: 'Including / starting with',
    examples: [
      { ko: '학생들을 비롯해서 선생님들도 모두 참석했다.', vi: 'Bao gồm cả học sinh, các giáo viên cũng đều tham dự.' }
    ],
    commonMistake: 'Đại diện tiêu biểu đứng trước 을/를 비롯해서.',
  },
  {
    id: 'g4-은-는물론',
    level: 4,
    title: 'N + 은/는 물론',
    formula: 'N-은/는 물론',
    meaningVi: '...là đương nhiên, không chỉ...',
    meaningEn: 'Not to mention / of course',
    examples: [
      { ko: '그는 한국어는 물론 영어도 잘한다.', vi: 'Anh ấy không chỉ giỏi tiếng Hàn mà tiếng Anh cũng giỏi.' }
    ],
    commonMistake: 'Tương đương với 은/는 말할 것도 없이.',
  },
  {
    id: 'g4-a-v-으-나',
    level: 4,
    title: 'A/V + (으)나',
    formula: 'A/V-(으)나',
    meaningVi: '...nhưng... (văn viết trang trọng)',
    meaningEn: 'But / however (formal text)',
    examples: [
      { ko: '그는 부자이나 행복하지 않다.', vi: 'Anh ấy giàu nhưng không hạnh phúc.' }
    ],
    commonMistake: 'Dạng rút gọn văn viết của -지만.',
  },
  {
    id: 'g5-a-v-으-되',
    level: 5,
    title: 'A/V + (으)되',
    formula: 'A/V-(으)되',
    meaningVi: '...nhưng... (thừa nhận vế 1 nhưng ra điều kiện vế 2)',
    meaningEn: 'Although..., provided that...',
    examples: [
      { ko: '술은 마시되 과음하지는 마세요.', vi: 'Uống rượu thì được nhưng đừng uống quá nhiều.' }
    ],
    commonMistake: 'Văn phong cổ/trang trọng ra điều kiện giới hạn.',
  },
  {
    id: 'g6-a-v-거늘',
    level: 6,
    title: 'A/V + 거늘',
    formula: 'A/V-거늘',
    meaningVi: '...huống chi... (lẽ tự nhiên)',
    meaningEn: 'How much more so...',
    examples: [
      { ko: '날씨도 좋거늘 집에만 있을 수 없다.', vi: 'Thời tiết đẹp thế này huống chi lại ở nhà mãi được.' }
    ],
    commonMistake: 'Cấu trúc cổ cao cấp thi TOPIK II.',
  },
  {
    id: 'g4-a-v-으-므로',
    level: 4,
    title: 'A/V + (으)므로',
    formula: 'A/V-(으)므로',
    meaningVi: 'Vì... nên... (lý do trang trọng văn viết)',
    meaningEn: 'Because / since (formal)',
    examples: [
      { ko: '그는 약속을 잘 지키므로 신뢰할 수 있다.', vi: 'Vì anh ấy giữ lời hứa rất tốt nên có thể tin tưởng được.' }
    ],
    commonMistake: 'Không nhầm với (으)ㅁ으로써 (bằng cách).',
  },
  {
    id: 'g5-a-v-느니만못하다',
    level: 5,
    title: 'A/V + 느니만 못하다',
    formula: 'A/V-느니만 못하다',
    meaningVi: '...không bằng... (chi bằng không làm)',
    meaningEn: 'Not as good as / worse than',
    examples: [
      { ko: '비싼 돈을 주고 사는 것보다 직접 만드는 것이 낫다.', vi: 'So với việc mua bằng tiền đắt thì tự làm sẽ tốt hơn.' }
    ],
    commonMistake: 'So sánh mức độ kém hơn.',
  },
  {
    id: 'g5-a-v-기에망정이지',
    level: 5,
    title: 'A/V + 기에 망정이지',
    formula: 'A/V-기에 망정이지',
    meaningVi: 'May mà... chứ không thì... (họa vô đơn chí)',
    meaningEn: 'Fortunate that..., otherwise',
    examples: [
      { ko: '네가 도와주었기에 망정이지 혼자서는 못 했을 거야.', vi: 'May mà có cậu giúp chứ không thì một mình tôi đã không làm được.' }
    ],
    commonMistake: 'Giả định hậu quả tồi tệ nếu không có vế 1.',
  },
  {
    id: 'g4-치고',
    level: 4,
    title: 'N + 치고',
    formula: 'N-치고',
    meaningVi: 'Đã là... thì không có ngoại lệ / So với mặt bằng chung',
    meaningEn: 'Without exception for / considering that it is',
    examples: [
      { ko: '아이치고 사탕을 싫어하는 아이는 없다.', vi: 'Đã là trẻ con thì không có đứa nào ghét kẹo.' }
    ],
    commonMistake: 'Mang 2 nghĩa: 100% ngoại lệ không có, hoặc so sánh ngoài dự kiến.',
  },
  {
    id: 'g4-a-v-다가는',
    level: 4,
    title: 'A/V + 다가는',
    formula: 'A/V-다가',
    meaningVi: 'Cứ tiếp tục... thì sẽ... (cảnh báo tiêu cực)',
    meaningEn: 'If you keep doing X, Y negative will happen',
    examples: [
      { ko: '그렇게 놀다가는 시험에 떨어질 것이다.', vi: 'Cứ chơi như thế thì sẽ trượt kỳ thi.' }
    ],
    commonMistake: 'Cảnh báo vế 2 là kết quả xấu.',
  },
  {
    id: 'g5-a-v-으-따름이다',
    level: 5,
    title: 'A/V + (으)ㄹ 따름이다',
    formula: 'A/V-(으)ㄹ 따름이다',
    meaningVi: 'Chỉ là... (không có lựa chọn/lý do khác)',
    meaningEn: 'Only / nothing more than',
    examples: [
      { ko: '저는 그저 제 할 일을 했을 따름입니다.', vi: 'Tôi chỉ là đã làm công việc của mình thôi.' }
    ],
    commonMistake: 'Trang trọng hơn (으)ㄹ 뿐이다.',
  },
  {
    id: 'g6-a-v-으-지니',
    level: 6,
    title: 'A/V + (으)ㄹ지니',
    formula: 'A/V-(으)ㄹ지니',
    meaningVi: '...nên hãy... (khuyên bảo trang trọng cổ)',
    meaningEn: 'Therefore / so be sure to',
    examples: [
      { ko: '곧 추워질지니 옷을 따뜻하게 입으세요.', vi: 'Trời sắp lạnh rồi nên hãy mặc ấm vào.' }
    ],
    commonMistake: 'Ngữ pháp cao cấp.',
  },
  {
    id: 'g4-에의하면',
    level: 4,
    title: 'N + 에 의하면',
    formula: 'N-에 의하면',
    meaningVi: 'Theo... (trích dẫn nguồn tin)',
    meaningEn: 'According to',
    examples: [
      { ko: '뉴스에 의하면 내일 비가 온다고 한다.', vi: 'Theo tin tức thì ngày mai trời sẽ mưa.' }
    ],
    commonMistake: 'Vế sau thường là câu trích dẫn gián tiếp -다고 한다.',
  },
  {
    id: 'g5-와-과더불어',
    level: 5,
    title: 'N + 와/과 더불어',
    formula: 'N-와/과 더불어',
    meaningVi: 'Cùng với... (đồng hành/cùng tồn tại)',
    meaningEn: 'Together with / along with',
    examples: [
      { ko: '가족과 더불어 행복한 시간을 보냈다.', vi: 'Tôi đã có một khoảng thời gian hạnh phúc cùng với gia đình.' }
    ],
    commonMistake: 'Văn phong trang trọng.',
  },
  {
    id: 'g5-을-를막론하고',
    level: 5,
    title: 'N + 을/를 막론하고',
    formula: 'N-을/를 막론하고',
    meaningVi: 'Bất kể... (không phân biệt)',
    meaningEn: 'Regardless of / irrespective of',
    examples: [
      { ko: '남녀노소를 막론하고 모두가 즐길 수 있는 영화이다.', vi: 'Đây là một bộ phim mà bất kể già trẻ gái trai đều có thể thưởng thức.' }
    ],
    commonMistake: 'Gắn sau các danh từ bao quát hai mặt.',
  },
  {
    id: 'g4-은-는커녕',
    level: 4,
    title: 'N + 은/는커녕',
    formula: 'N-은/는커녕',
    meaningVi: 'Nói gì đến... (ngay cả điều nhỏ hơn cũng không)',
    meaningEn: 'Let alone / far from',
    examples: [
      { ko: '밥은커녕 물도 못 마셨다.', vi: 'Nói gì đến cơm, tôi còn chưa uống được nước.' }
    ],
    commonMistake: 'Dạng danh từ tương ứng của 기는커녕.',
  },
  {
    id: 'g4-a-v-기가무섭게',
    level: 4,
    title: 'A/V + 기가 무섭게',
    formula: 'A/V-기가 무섭게',
    meaningVi: 'Ngay khi... (lập tức tức thì)',
    meaningEn: 'Right after / the moment',
    examples: [
      { ko: '수업이 끝나기가 무섭게 학생들이 교실을 나갔다.', vi: 'Ngay khi buổi học kết thúc, học sinh đã rời khỏi lớp học.' }
    ],
    commonMistake: 'Sắc thái nhanh hơn 자마자.',
  },
  {
    id: 'g4-a-v-는다고해서',
    level: 4,
    title: 'A/V + 는다고 해서',
    formula: 'A/V-는다고 해서',
    meaningVi: 'Không phải cứ... là... (phủ định quy kết)',
    meaningEn: 'Just because X doesn’t mean Y',
    examples: [
      { ko: '돈이 많다고 해서 행복한 것은 아니다.', vi: 'Không phải cứ có nhiều tiền là hạnh phúc.' }
    ],
    commonMistake: 'Vế 2 thường là phủ định 아니다 / 것은 아니다.',
  },
  {
    id: 'g5-a-v-으-나머지',
    level: 5,
    title: 'A/V + (으)ㄴ 나머지',
    formula: 'A/V-(으)ㄴ 나머지',
    meaningVi: 'Do quá... nên (kết quả ngoài ý muốn)',
    meaningEn: 'As a result of excessive...',
    examples: [
      { ko: '너무 화가 난 나머지 말을 할 수가 없었다.', vi: 'Do quá tức giận nên tôi đã không thể nói nên lời.' }
    ],
    commonMistake: 'Cảm xúc quá mức.',
  },
  {
    id: 'g4-a-v-으-턱이없다',
    level: 4,
    title: 'A/V + (으)ㄹ 턱이 없다',
    formula: 'A/V-(으)ㄹ 턱이 없다',
    meaningVi: 'Không có lý nào... (phủ định hoàn toàn căn cứ)',
    meaningEn: 'No reason why / impossible that',
    examples: [
      { ko: '그가 그런 실수를 할 턱이 없다.', vi: 'Không có lý nào anh ấy lại mắc lỗi như vậy.' }
    ],
    commonMistake: 'Tương đương với (으)ㄹ 리가 없다.',
  },
  {
    id: 'g5-a-v-으-성싶다',
    level: 5,
    title: 'A/V + (으)ㄹ 성싶다',
    formula: 'A/V-(으)ㄹ 성싶다',
    meaningVi: 'Có lẽ, hình như (phỏng đoán phán đoán)',
    meaningEn: 'Likely that / seems like',
    examples: [
      { ko: '비가 올 성싶다.', vi: 'Có lẽ trời sẽ mưa.' }
    ],
    commonMistake: 'Văn phong trang trọng phỏng đoán.',
  },
  {
    id: 'g6-a-v-으-려니하다',
    level: 6,
    title: 'A/V + (으)려니 하다',
    formula: 'A/V-(으)려니 하다',
    meaningVi: 'Cứ nghĩ là..., cứ tưởng là... (chủ quan)',
    meaningEn: 'Assumed that naturally...',
    examples: [
      { ko: '그가 올 줄로만 알았으려니 했다.', vi: 'Tôi cứ nghĩ là anh ấy sẽ đến.' }
    ],
    commonMistake: 'Phỏng đoán chủ quan tự nhiên.',
  },
  {
    id: 'g5-a-v-고도',
    level: 5,
    title: 'A/V + 고도',
    formula: 'A/V-고도',
    meaningVi: '...mà vẫn... (kết quả bất ngờ trái mong đợi)',
    meaningEn: 'Even after doing / despite',
    examples: [
      { ko: '그는 실패하고도 좌절하지 않았다.', vi: 'Anh ấy thất bại mà vẫn không nản lòng.' }
    ],
    commonMistake: 'Tương phản giữa nguyên nhân và hành động tiếp theo.',
  },
  {
    id: 'g6-a-v-기로서니',
    level: 6,
    title: 'A/V + 기로서니',
    formula: 'A/V-기로서니',
    meaningVi: 'Dù... đến mấy đi nữa (không thể bào chữa vế 2)',
    meaningEn: 'Even if X is true, Y shouldn’t happen',
    examples: [
      { ko: '아무리 화가 나기로서니 그렇게 심한 말을 할 수는 없다.', vi: 'Dù có tức giận đến mấy cũng không thể nói những lời cay nghiệt như vậy.' }
    ],
    commonMistake: 'Vế 2 thường là câu phản bác.',
  },
  {
    id: 'g5-a-v-는마당에',
    level: 5,
    title: 'A/V + 는 마당에',
    formula: 'A/V-는 마당에',
    meaningVi: 'Trong hoàn cảnh... (thời điểm thích hợp/bối cảnh)',
    meaningEn: 'Under the circumstances that...',
    examples: [
      { ko: '모두가 힘든 마당에 서로 도와야 한다.', vi: 'Trong hoàn cảnh mọi người đều khó khăn thì phải giúp đỡ lẫn nhau.' }
    ],
    commonMistake: 'Tạo bối cảnh đưa ra trách nhiệm hoặc hành động nên làm.',
  },
  {
    id: 'g5-a-v-으-지라도',
    level: 5,
    title: 'A/V + (으)ㄹ지라도',
    formula: 'A/V-(으)ㄹ지라도',
    meaningVi: 'Dù... đi nữa (giả định cực đoan)',
    meaningEn: 'Even though / even if',
    examples: [
      { ko: '비록 가난할지라도 마음만은 부자다.', vi: 'Dù nghèo khó nhưng tấm lòng thì giàu có.' }
    ],
    commonMistake: 'Trang trọng hơn -아/어도.',
  },
  {
    id: 'g6-인들',
    level: 6,
    title: 'N + 인들',
    formula: 'N-인들',
    meaningVi: 'Dù là... thì cũng... (nhấn mạnh ngay cả người giỏi nhất)',
    meaningEn: 'Even if it is [X]',
    examples: [
      { ko: '천하장사인들 이 병을 이길 수는 없다.', vi: 'Dù là thiên hạ vô địch cũng không thể chiến thắng được căn bệnh này.' }
    ],
    commonMistake: 'Đi với câu hỏi tu từ hoặc phủ định.',
  },
  {
    id: 'g1-e-itta',
    level: 1,
    title: '에 있다/없다',
    formula: 'N에 있다/없다',
    meaningVi: 'Có/không có ở đâu; diễn tả vị trí tồn tại.',
    meaningEn: 'To be/not be at a location.',
    examples: [
      { ko: '책이 책상 위에 있어요.', vi: 'Quyển sách ở trên bàn.' },
      { ko: '교실에 학생이 없어요.', vi: 'Trong lớp không có học sinh.' },
    ],
    commonMistake: 'Dùng 에 cho vị trí tồn tại; khi hành động diễn ra ở đâu thì dùng 에서.',
  },
  {
    id: 'g1-eseo-action',
    level: 1,
    title: '에서',
    formula: 'N에서 V',
    meaningVi: 'Ở đâu làm gì; đánh dấu nơi diễn ra hành động.',
    meaningEn: 'At/in a place where an action happens.',
    examples: [
      { ko: '도서관에서 공부해요.', vi: 'Tôi học ở thư viện.' },
      { ko: '집에서 밥을 먹어요.', vi: 'Tôi ăn cơm ở nhà.' },
    ],
    commonMistake: 'Không nhầm 에서 với 에. 에서 là nơi hành động xảy ra, 에 là vị trí/đích đến.',
  },
  {
    id: 'g1-hago-wa-gwa',
    level: 1,
    title: '하고/와/과',
    formula: 'N하고 N / N와/과 N',
    meaningVi: 'Và/với; nối danh từ hoặc nói làm gì với ai.',
    meaningEn: 'And/with; connects nouns or marks accompaniment.',
    examples: [
      { ko: '친구하고 영화를 봤어요.', vi: 'Tôi xem phim với bạn.' },
      { ko: '사과와 바나나를 샀어요.', vi: 'Tôi đã mua táo và chuối.' },
    ],
    commonMistake: '하고 tự nhiên trong hội thoại; 와/과 trang trọng hơn một chút.',
  },
  {
    id: 'g1-buteo-kkaji',
    level: 1,
    title: '부터/까지',
    formula: 'N부터 N까지',
    meaningVi: 'Từ... đến...; dùng cho thời gian hoặc phạm vi.',
    meaningEn: 'From... to...; for time or range.',
    examples: [
      { ko: '아홉 시부터 다섯 시까지 일해요.', vi: 'Tôi làm từ 9 giờ đến 5 giờ.' },
      { ko: '서울부터 부산까지 기차로 가요.', vi: 'Tôi đi tàu từ Seoul đến Busan.' },
    ],
    commonMistake: 'Đừng nhầm 까지 với 에. 까지 nhấn mạnh điểm kết thúc.',
  },
  {
    id: 'g1-a-eo-yo',
    level: 1,
    title: '-아/어요',
    formula: 'V/A-아/어요',
    meaningVi: 'Đuôi câu lịch sự thân mật hiện tại.',
    meaningEn: 'Polite informal present sentence ending.',
    examples: [
      { ko: '저는 한국어를 공부해요.', vi: 'Tôi học tiếng Hàn.' },
      { ko: '오늘 날씨가 좋아요.', vi: 'Thời tiết hôm nay đẹp.' },
    ],
    commonMistake: 'Chú ý biến đổi bất quy tắc như 듣다 -> 들어요, 춥다 -> 추워요.',
  },
  {
    id: 'g1-eun-neun-topic',
    level: 1,
    title: '은/는',
    formula: 'N은/는',
    meaningVi: 'Trợ từ chủ đề; nêu điều đang nói tới hoặc so sánh ngầm.',
    meaningEn: 'Topic particle; marks what is being discussed.',
    examples: [
      { ko: '저는 베트남 사람이에요.', vi: 'Tôi là người Việt Nam.' },
      { ko: '오늘은 시간이 없어요.', vi: 'Hôm nay thì tôi không có thời gian.' },
    ],
    commonMistake: '은/는 là chủ đề, 이/가 là chủ ngữ mới/nhấn mạnh. Hai trợ từ này không luôn thay thế nhau.',
  },
  {
    id: 'g1-i-ga-subject',
    level: 1,
    title: '이/가',
    formula: 'N이/가',
    meaningVi: 'Trợ từ chủ ngữ; thường giới thiệu thông tin mới hoặc nhấn mạnh chủ thể.',
    meaningEn: 'Subject particle; often marks new or emphasized information.',
    examples: [
      { ko: '비가 와요.', vi: 'Trời mưa.' },
      { ko: '누가 왔어요?', vi: 'Ai đã đến vậy?' },
    ],
    commonMistake: 'Với câu trả lời cho ai/cái gì, 이/가 thường tự nhiên hơn 은/는.',
  },
  {
    id: 'g1-eul-reul-object',
    level: 1,
    title: '을/를',
    formula: 'N을/를 V',
    meaningVi: 'Trợ từ tân ngữ; đánh dấu đối tượng bị tác động bởi hành động.',
    meaningEn: 'Object particle; marks the object of an action.',
    examples: [
      { ko: '커피를 마셔요.', vi: 'Tôi uống cà phê.' },
      { ko: '책을 읽어요.', vi: 'Tôi đọc sách.' },
    ],
    commonMistake: 'Không dùng 을/를 với tính từ miêu tả trực tiếp như 예쁘다, 좋다.',
  },
  {
    id: 'g2-jiman',
    level: 2,
    title: '-지만',
    formula: 'V/A-지만',
    meaningVi: 'Nhưng; nối hai ý tương phản nhẹ.',
    meaningEn: 'But; connects contrasting clauses.',
    examples: [
      { ko: '비싸지만 맛있어요.', vi: 'Đắt nhưng ngon.' },
      { ko: '피곤하지만 공부해야 해요.', vi: 'Mệt nhưng phải học.' },
    ],
    commonMistake: 'Hai vế cần có quan hệ tương phản; nếu chỉ nối thông tin cùng chiều thì dùng -고.',
  },
  {
    id: 'g2-go-sipeohada',
    level: 2,
    title: '-고 싶어하다',
    formula: 'V-고 싶어하다',
    meaningVi: 'Người khác muốn làm gì; dùng cho mong muốn của ngôi thứ ba.',
    meaningEn: 'To say someone else wants to do something.',
    examples: [
      { ko: '동생은 한국에 가고 싶어해요.', vi: 'Em tôi muốn đi Hàn Quốc.' },
      { ko: '친구가 쉬고 싶어했어요.', vi: 'Bạn tôi đã muốn nghỉ.' },
    ],
    commonMistake: 'Với bản thân dùng -고 싶다; với người khác thường dùng -고 싶어하다.',
  },
  {
    id: 'g2-a-eo-juseyo',
    level: 2,
    title: '-아/어 주세요',
    formula: 'V-아/어 주세요',
    meaningVi: 'Làm ơn hãy làm gì cho tôi/cho ai.',
    meaningEn: 'Please do something for me/someone.',
    examples: [
      { ko: '문을 닫아 주세요.', vi: 'Làm ơn đóng cửa giúp tôi.' },
      { ko: '이 단어를 설명해 주세요.', vi: 'Hãy giải thích từ này giúp tôi.' },
    ],
    commonMistake: 'Không dùng với hành động người nghe không thể làm cho mình; cần đúng quan hệ nhờ vả.',
  },
  {
    id: 'g2-a-eodo-doeda',
    level: 2,
    title: '-아/어도 되다',
    formula: 'V-아/어도 되다',
    meaningVi: 'Được phép làm gì; làm cũng được.',
    meaningEn: 'May; be allowed to do something.',
    examples: [
      { ko: '여기 앉아도 돼요?', vi: 'Tôi ngồi đây được không?' },
      { ko: '사진을 찍어도 돼요.', vi: 'Chụp ảnh cũng được.' },
    ],
    commonMistake: 'Phủ định cấm đoán là -(으)면 안 되다, không phải 안 -아/어도 되다.',
  },
  {
    id: 'g2-eumyeon-an-doeda',
    level: 2,
    title: '-으면/면 안 되다',
    formula: 'V-(으)면 안 되다',
    meaningVi: 'Không được làm gì; bị cấm làm gì.',
    meaningEn: 'Must not; should not do something.',
    examples: [
      { ko: '여기에서 담배를 피우면 안 돼요.', vi: 'Không được hút thuốc ở đây.' },
      { ko: '시험 중에 이야기하면 안 돼요.', vi: 'Trong khi thi không được nói chuyện.' },
    ],
    commonMistake: 'Không nhầm với -지 않아도 되다 nghĩa là không cần làm cũng được.',
  },
  {
    id: 'g2-neun-geot',
    level: 2,
    title: '-는 것',
    formula: 'V-는 것',
    meaningVi: 'Việc làm gì; biến động từ thành danh từ/cụm danh từ.',
    meaningEn: 'The act of doing; nominalizes a verb.',
    examples: [
      { ko: '한국어를 배우는 것이 재미있어요.', vi: 'Việc học tiếng Hàn rất thú vị.' },
      { ko: '운동하는 것을 좋아해요.', vi: 'Tôi thích việc tập thể dục.' },
    ],
    commonMistake: 'Dùng -는 것 với động từ hiện tại; không dùng nguyên dạng động từ trước danh từ.',
  },
  {
    id: 'g2-bakke',
    level: 2,
    title: '밖에',
    formula: 'N밖에 + phủ định',
    meaningVi: 'Chỉ/có mỗi; luôn đi với vị ngữ phủ định.',
    meaningEn: 'Only; used with a negative predicate.',
    examples: [
      { ko: '천 원밖에 없어요.', vi: 'Tôi chỉ có 1.000 won.' },
      { ko: '한 명밖에 안 왔어요.', vi: 'Chỉ có một người đến.' },
    ],
    commonMistake: '밖에 cần phủ định phía sau: 없어요, 안 왔어요, 못 해요.',
  },
  {
    id: 'g2-mada',
    level: 2,
    title: '마다',
    formula: 'N마다',
    meaningVi: 'Mỗi/mọi; lặp lại theo từng đơn vị.',
    meaningEn: 'Every/each.',
    examples: [
      { ko: '아침마다 운동해요.', vi: 'Mỗi sáng tôi tập thể dục.' },
      { ko: '나라마다 문화가 달라요.', vi: 'Mỗi nước có văn hóa khác nhau.' },
    ],
    commonMistake: 'Không dùng chung dư nghĩa với 모든 trong cùng một cụm nếu không cần nhấn mạnh.',
  },
  {
    id: 'g3-dago-hada',
    level: 3,
    title: '-다고 하다',
    formula: 'V/A-다고 하다',
    meaningVi: 'Nghe/nói rằng; trích dẫn gián tiếp câu trần thuật.',
    meaningEn: 'Indirect quotation for statements.',
    examples: [
      { ko: '친구가 내일 바쁘다고 했어요.', vi: 'Bạn tôi nói ngày mai bận.' },
      { ko: '뉴스에서 비가 온다고 했어요.', vi: 'Tin tức nói trời sẽ mưa.' },
    ],
    commonMistake: 'Đuôi trích dẫn đổi theo loại câu: câu hỏi dùng -냐고 하다.',
  },
  {
    id: 'g3-nyago-hada',
    level: 3,
    title: '-냐고 하다',
    formula: 'V/A-(느)냐고 하다',
    meaningVi: 'Hỏi rằng; trích dẫn gián tiếp câu hỏi.',
    meaningEn: 'Indirect quotation for questions.',
    examples: [
      { ko: '선생님이 어디에 가느냐고 물었어요.', vi: 'Thầy/cô hỏi đi đâu.' },
      { ko: '친구가 숙제를 했냐고 했어요.', vi: 'Bạn hỏi tôi đã làm bài chưa.' },
    ],
    commonMistake: 'Không dùng -다고 하다 cho câu hỏi trực tiếp.',
  },
  {
    id: 'g3-jago-hada',
    level: 3,
    title: '-자고 하다',
    formula: 'V-자고 하다',
    meaningVi: 'Rủ/đề nghị rằng hãy cùng làm gì.',
    meaningEn: 'Indirect quotation for suggestions.',
    examples: [
      { ko: '친구가 같이 점심을 먹자고 했어요.', vi: 'Bạn rủ cùng ăn trưa.' },
      { ko: '동생이 영화를 보자고 했어요.', vi: 'Em tôi rủ xem phim.' },
    ],
    commonMistake: 'Chỉ dùng cho lời rủ rê/đề nghị cùng làm, không dùng cho mệnh lệnh.',
  },
  {
    id: 'g3-eurago-hada',
    level: 3,
    title: '-으라고/라고 하다',
    formula: 'V-(으)라고 하다',
    meaningVi: 'Bảo/yêu cầu ai làm gì; trích dẫn gián tiếp mệnh lệnh.',
    meaningEn: 'Indirect quotation for commands.',
    examples: [
      { ko: '의사가 쉬라고 했어요.', vi: 'Bác sĩ bảo hãy nghỉ ngơi.' },
      { ko: '선생님이 책을 읽으라고 하셨어요.', vi: 'Thầy/cô bảo đọc sách.' },
    ],
    commonMistake: 'Đừng nhầm với -자고 하다, vì -자고 là rủ cùng làm.',
  },
  {
    id: 'g3-at-eumyeon-joketda',
    level: 3,
    title: '-았/었으면 좋겠다',
    formula: 'V/A-았/었으면 좋겠다',
    meaningVi: 'Ước gì/mong là; diễn tả mong muốn.',
    meaningEn: 'I wish/hope that.',
    examples: [
      { ko: '한국어를 잘했으면 좋겠어요.', vi: 'Tôi ước mình giỏi tiếng Hàn.' },
      { ko: '내일 날씨가 좋았으면 좋겠어요.', vi: 'Mong là thời tiết ngày mai đẹp.' },
    ],
    commonMistake: 'Dù nói về tương lai vẫn thường dùng dạng quá khứ -았/었으면 좋겠다.',
  },
  {
    id: 'g3-giro-hada',
    level: 3,
    title: '-기로 하다',
    formula: 'V-기로 하다',
    meaningVi: 'Quyết định sẽ làm gì.',
    meaningEn: 'Decide to do something.',
    examples: [
      { ko: '다음 달부터 운동하기로 했어요.', vi: 'Tôi đã quyết định tập thể dục từ tháng sau.' },
      { ko: '친구와 도서관에서 만나기로 했어요.', vi: 'Tôi đã hẹn gặp bạn ở thư viện.' },
    ],
    commonMistake: 'Không dùng để nói thói quen đã có sẵn; nó nhấn vào quyết định/hẹn ước.',
  },
  {
    id: 'g3-neun-jungida',
    level: 3,
    title: '-는 중이다',
    formula: 'V-는 중이다 / N 중이다',
    meaningVi: 'Đang trong lúc làm gì.',
    meaningEn: 'Be in the middle of doing something.',
    examples: [
      { ko: '지금 회의하는 중이에요.', vi: 'Bây giờ tôi đang họp.' },
      { ko: '수업 중에는 전화를 받지 마세요.', vi: 'Trong giờ học đừng nghe điện thoại.' },
    ],
    commonMistake: 'Với hội thoại đơn giản, -고 있다 cũng tự nhiên; -는 중이다 nhấn mạnh đang trong quá trình.',
  },
  {
    id: 'g3-neun-daesin-e',
    level: 3,
    title: '-는 대신에',
    formula: 'V-는 대신에 / N 대신에',
    meaningVi: 'Thay vì/đổi lại; diễn tả sự thay thế hoặc bù trừ.',
    meaningEn: 'Instead of/in return for.',
    examples: [
      { ko: '커피를 마시는 대신에 차를 마셨어요.', vi: 'Thay vì uống cà phê tôi uống trà.' },
      { ko: '제가 도와주는 대신에 저녁을 사 주세요.', vi: 'Đổi lại việc tôi giúp, hãy mời tôi ăn tối.' },
    ],
    commonMistake: 'Cần rõ quan hệ thay thế hoặc bù trừ giữa hai vế.',
  },
  {
    id: 'g4-neun-dongan',
    level: 4,
    title: '-는 동안',
    formula: 'V-는 동안 / N 동안',
    meaningVi: 'Trong khi/trong suốt khoảng thời gian.',
    meaningEn: 'While/during.',
    examples: [
      { ko: '한국에 사는 동안 많이 배웠어요.', vi: 'Trong thời gian sống ở Hàn tôi đã học được nhiều.' },
      { ko: '방학 동안 아르바이트를 했어요.', vi: 'Trong kỳ nghỉ tôi đã làm thêm.' },
    ],
    commonMistake: '동안 nhấn mạnh khoảng thời gian kéo dài, không chỉ một thời điểm.',
  },
  {
    id: 'g4-deon',
    level: 4,
    title: '-던',
    formula: 'V/A-던',
    meaningVi: 'Đã từng/đang dở trong quá khứ; hồi tưởng chưa hoàn tất hoặc lặp lại.',
    meaningEn: 'Past recollection, often unfinished or repeated.',
    examples: [
      { ko: '제가 자주 가던 카페예요.', vi: 'Đây là quán cà phê tôi từng hay đến.' },
      { ko: '읽던 책을 다시 폈어요.', vi: 'Tôi mở lại cuốn sách đang đọc dở.' },
    ],
    commonMistake: 'Nếu hành động đã hoàn tất một lần rõ ràng, -았/었던 có thể hợp hơn.',
  },
  {
    id: 'g4-at-eot-deon',
    level: 4,
    title: '-았/었던',
    formula: 'V/A-았/었던',
    meaningVi: 'Đã từng hoàn tất trong quá khứ; hồi tưởng trải nghiệm đã qua.',
    meaningEn: 'Past completed recollection.',
    examples: [
      { ko: '작년에 갔던 식당이 아직도 유명해요.', vi: 'Quán tôi đã đi năm ngoái giờ vẫn nổi tiếng.' },
      { ko: '어렸을 때 살았던 집이 생각나요.', vi: 'Tôi nhớ ngôi nhà từng sống hồi nhỏ.' },
    ],
    commonMistake: 'Phân biệt với -던: -았/었던 thường nhấn mạnh đã hoàn tất/đã từng.',
  },
  {
    id: 'g4-gi-wihaeseo',
    level: 4,
    title: '-기 위해서',
    formula: 'V-기 위해서 / N을 위해서',
    meaningVi: 'Để/nhằm; diễn tả mục đích trang trọng.',
    meaningEn: 'In order to/for the sake of.',
    examples: [
      { ko: '합격하기 위해서 매일 공부해요.', vi: 'Để đỗ, tôi học mỗi ngày.' },
      { ko: '건강을 위해서 운동을 시작했어요.', vi: 'Vì sức khỏe tôi bắt đầu tập thể dục.' },
    ],
    commonMistake: 'Không dùng với tính từ trực tiếp; cần động từ/mục tiêu hành động.',
  },
  {
    id: 'g4-e-ttareumyeon',
    level: 4,
    title: '에 따르면',
    formula: 'N에 따르면',
    meaningVi: 'Theo như; dẫn nguồn thông tin.',
    meaningEn: 'According to.',
    examples: [
      { ko: '뉴스에 따르면 내일 비가 온대요.', vi: 'Theo tin tức, ngày mai trời sẽ mưa.' },
      { ko: '조사 결과에 따르면 만족도가 높아요.', vi: 'Theo kết quả khảo sát, mức hài lòng cao.' },
    ],
    commonMistake: 'Sau 에 따르면 thường là thông tin được dẫn lại, không phải ý kiến hoàn toàn cá nhân.',
  },
  {
    id: 'g4-eul-tonghaeseo',
    level: 4,
    title: '-을/를 통해서',
    formula: 'N을/를 통해서',
    meaningVi: 'Thông qua; bằng phương tiện/kênh nào đó.',
    meaningEn: 'Through/by means of.',
    examples: [
      { ko: '인터넷을 통해서 정보를 찾았어요.', vi: 'Tôi tìm thông tin qua internet.' },
      { ko: '봉사 활동을 통해서 많은 것을 배웠어요.', vi: 'Thông qua hoạt động tình nguyện tôi học được nhiều điều.' },
    ],
    commonMistake: 'Không dùng cho công cụ vật lý đơn giản mọi lúc; với phương tiện cụ thể có thể dùng -으로.',
  },
  {
    id: 'g4-bbunida',
    level: 4,
    title: '-을/ㄹ 뿐이다',
    formula: 'V-(으)ㄹ 뿐이다 / N뿐이다',
    meaningVi: 'Chỉ là/chỉ làm vậy thôi.',
    meaningEn: 'Only/merely.',
    examples: [
      { ko: '저는 제 생각을 말했을 뿐이에요.', vi: 'Tôi chỉ nói suy nghĩ của mình thôi.' },
      { ko: '그건 변명일 뿐이에요.', vi: 'Đó chỉ là lời biện minh thôi.' },
    ],
    commonMistake: 'Không nhầm với -뿐만 아니라 nghĩa là không chỉ... mà còn.',
  },
  {
    id: 'g4-da-bomyeon',
    level: 4,
    title: '-다 보면',
    formula: 'V-다 보면',
    meaningVi: 'Nếu cứ làm thì dần dần sẽ...',
    meaningEn: 'If one keeps doing, eventually...',
    examples: [
      { ko: '계속 연습하다 보면 익숙해질 거예요.', vi: 'Nếu cứ luyện tập thì dần sẽ quen.' },
      { ko: '살다 보면 이런 일도 있어요.', vi: 'Sống thì đôi khi cũng có chuyện như vậy.' },
    ],
    commonMistake: 'Không dùng cho hành động chỉ xảy ra một lần.',
  },
  {
    id: 'g5-neun-cheokhada',
    level: 5,
    title: '-는 척하다',
    formula: 'V-는 척하다 / A-(으)ㄴ 척하다',
    meaningVi: 'Giả vờ làm gì/giả vờ như thế.',
    meaningEn: 'Pretend to do/be.',
    examples: [
      { ko: '그는 모르는 척했어요.', vi: 'Anh ấy giả vờ không biết.' },
      { ko: '자는 척하지 마세요.', vi: 'Đừng giả vờ ngủ.' },
    ],
    commonMistake: '척하다 luôn có sắc thái giả vờ, không dùng cho trạng thái thật.',
  },
  {
    id: 'g5-gineunkeonyeong',
    level: 5,
    title: '-기는커녕',
    formula: 'V-기는커녕 / N은커녕',
    meaningVi: 'Đừng nói đến... ngay cả... cũng không.',
    meaningEn: 'Far from; let alone.',
    examples: [
      { ko: '여행은커녕 집에서 쉬지도 못했어요.', vi: 'Đừng nói đến đi du lịch, nghỉ ở nhà cũng không được.' },
      { ko: '사과하기는커녕 화를 냈어요.', vi: 'Đừng nói xin lỗi, anh ấy còn nổi giận.' },
    ],
    commonMistake: 'Thường đi với kết quả trái kỳ vọng và sắc thái phủ định/mạnh.',
  },
  {
    id: 'g5-eul-bbundeoreo',
    level: 5,
    title: '-을/ㄹ 뿐더러',
    formula: 'V/A-(으)ㄹ 뿐더러',
    meaningVi: 'Không những... mà còn; văn viết hơn -뿐만 아니라.',
    meaningEn: 'Not only... but also; relatively formal.',
    examples: [
      { ko: '가격이 쌀 뿐더러 품질도 좋아요.', vi: 'Không những giá rẻ mà chất lượng cũng tốt.' },
      { ko: '그는 성실할 뿐더러 책임감도 강해요.', vi: 'Anh ấy không những chăm chỉ mà còn có trách nhiệm.' },
    ],
    commonMistake: 'Hai vế thường cùng hướng đánh giá, không phải tương phản.',
  },
  {
    id: 'g5-neun-banmyeon-e',
    level: 5,
    title: '-는 반면에',
    formula: 'V-는 반면에 / A-(으)ㄴ 반면에',
    meaningVi: 'Mặt khác/trái lại; so sánh hai mặt đối lập.',
    meaningEn: 'On the other hand/whereas.',
    examples: [
      { ko: '도시는 편리한 반면에 복잡해요.', vi: 'Thành phố tiện lợi nhưng mặt khác lại phức tạp.' },
      { ko: '그 일은 힘든 반면에 보람이 있어요.', vi: 'Việc đó vất vả nhưng cũng đáng làm.' },
    ],
    commonMistake: 'Cần có hai mặt trái chiều rõ ràng.',
  },
  {
    id: 'g5-euro-inhae',
    level: 5,
    title: '-으로 인해',
    formula: 'N으로 인해',
    meaningVi: 'Do/vì; nguyên nhân trang trọng, thường dùng trong tin tức/văn viết.',
    meaningEn: 'Due to; formal cause expression.',
    examples: [
      { ko: '폭우로 인해 경기가 취소됐어요.', vi: 'Do mưa lớn, trận đấu bị hủy.' },
      { ko: '사고로 인해 길이 막혔어요.', vi: 'Do tai nạn, đường bị tắc.' },
    ],
    commonMistake: 'Trong hội thoại đời thường, 때문에 thường tự nhiên hơn.',
  },
  {
    id: 'g5-e-bulgwahada',
    level: 5,
    title: '에 불과하다',
    formula: 'N에 불과하다',
    meaningVi: 'Chỉ là/không hơn; nhấn mạnh số lượng hoặc mức độ thấp.',
    meaningEn: 'Be merely/no more than.',
    examples: [
      { ko: '그것은 시작에 불과해요.', vi: 'Đó chỉ là khởi đầu thôi.' },
      { ko: '참가자는 열 명에 불과했어요.', vi: 'Người tham gia chỉ có 10 người.' },
    ],
    commonMistake: 'Mang sắc thái đánh giá thấp/không nhiều, không trung tính như -뿐이다.',
  },
  {
    id: 'g5-e-dallyeo-itta',
    level: 5,
    title: '에 달려 있다',
    formula: 'N에 달려 있다',
    meaningVi: 'Phụ thuộc vào điều gì.',
    meaningEn: 'Depend on something.',
    examples: [
      { ko: '성공은 노력에 달려 있어요.', vi: 'Thành công phụ thuộc vào nỗ lực.' },
      { ko: '결과는 선택에 달려 있어요.', vi: 'Kết quả phụ thuộc vào lựa chọn.' },
    ],
    commonMistake: 'Không dùng để nói vị trí treo vật lý; ở đây là nghĩa phụ thuộc.',
  },
  {
    id: 'g5-neun-beobida',
    level: 5,
    title: '-는 법이다',
    formula: 'V-는 법이다 / A-(으)ㄴ 법이다',
    meaningVi: 'Thường/đương nhiên là như vậy; quy luật chung.',
    meaningEn: 'It is natural/common that.',
    examples: [
      { ko: '노력하면 결과가 따라오는 법이에요.', vi: 'Nếu nỗ lực thì kết quả thường sẽ theo sau.' },
      { ko: '사람은 누구나 실수하는 법이에요.', vi: 'Con người ai cũng thường mắc lỗi.' },
    ],
    commonMistake: 'Không dùng cho sự kiện cá biệt không mang tính quy luật.',
  },
  {
    id: 'g6-eul-jieonjeong',
    level: 6,
    title: '-을지언정',
    formula: 'V/A-(으)ㄹ지언정',
    meaningVi: 'Dù có... thì cũng; nhượng bộ mạnh, văn viết/trang trọng.',
    meaningEn: 'Even if; emphatic formal concession.',
    examples: [
      { ko: '실패할지언정 포기하지 않겠어요.', vi: 'Dù có thất bại tôi cũng sẽ không bỏ cuộc.' },
      { ko: '늦을지언정 거짓말은 하지 마세요.', vi: 'Dù có muộn cũng đừng nói dối.' },
    ],
    commonMistake: 'Trang trọng hơn -아/어도, không hợp hội thoại quá đơn giản.',
  },
  {
    id: 'g6-eundeul',
    level: 6,
    title: '-은들/ㄴ들',
    formula: 'V-(으)ㄴ들 / A-(으)ㄴ들',
    meaningVi: 'Dù... thì liệu có; nhượng bộ kèm sắc thái hoài nghi.',
    meaningEn: 'Even if; rhetorical concession.',
    examples: [
      { ko: '후회한들 무슨 소용이 있겠어요?', vi: 'Dù hối hận thì có ích gì chứ?' },
      { ko: '지금 떠난들 제시간에 도착하기 어려워요.', vi: 'Dù bây giờ đi thì cũng khó đến đúng giờ.' },
    ],
    commonMistake: 'Thường dùng trong câu tu từ/than thở, không phải nhượng bộ trung tính.',
  },
  {
    id: 'g6-euryeonmaneun',
    level: 6,
    title: '-으련마는',
    formula: 'V/A-(으)련마는',
    meaningVi: 'Chắc hẳn sẽ... nhưng; kỳ vọng trái với thực tế, văn chương.',
    meaningEn: 'Would probably... but; literary contrast to expectation.',
    examples: [
      { ko: '조금만 더 노력했으면 성공했으련마는 아쉬워요.', vi: 'Nếu cố thêm chút nữa chắc đã thành công, tiếc thật.' },
      { ko: '그도 사정을 알면 이해하련마는 연락이 안 돼요.', vi: 'Nếu biết chuyện chắc anh ấy sẽ hiểu, nhưng không liên lạc được.' },
    ],
    commonMistake: 'Mẫu này rất trang trọng/văn viết, không dùng như -지만 thông thường.',
  },
  {
    id: 'g6-gi-ilssuida',
    level: 6,
    title: '-기 일쑤이다',
    formula: 'V-기 일쑤이다',
    meaningVi: 'Thường xuyên dễ xảy ra việc không tốt.',
    meaningEn: 'Be prone to; often end up doing something undesirable.',
    examples: [
      { ko: '준비 없이 가면 실수하기 일쑤예요.', vi: 'Nếu đi mà không chuẩn bị thì thường hay mắc lỗi.' },
      { ko: '밤을 새우면 수업 시간에 졸기 일쑤예요.', vi: 'Nếu thức trắng đêm thì hay ngủ gật trong giờ học.' },
    ],
    commonMistake: 'Chủ yếu dùng cho kết quả tiêu cực lặp lại.',
  },
  {
    id: 'g6-gieseo-mangjeongiji',
    level: 6,
    title: '-기에 망정이지',
    formula: 'V/A-기에 망정이지',
    meaningVi: 'May mà... chứ nếu không thì đã có kết quả xấu.',
    meaningEn: 'Fortunately because..., otherwise something bad would have happened.',
    examples: [
      { ko: '일찍 출발했기에 망정이지 늦을 뻔했어요.', vi: 'May mà xuất phát sớm chứ suýt muộn.' },
      { ko: '도움을 받았기에 망정이지 혼자서는 못 했을 거예요.', vi: 'May mà được giúp chứ một mình chắc không làm được.' },
    ],
    commonMistake: 'Phía sau thường ngầm/hiện kết quả xấu nếu điều may mắn không xảy ra.',
  },
  {
    id: 'g6-da-motae',
    level: 6,
    title: '-다 못해',
    formula: 'V-다 못해',
    meaningVi: 'Làm mãi/đến mức không chịu được nên chuyển sang hành động khác.',
    meaningEn: 'After doing to the point of no longer being able to, then...',
    examples: [
      { ko: '기다리다 못해 직접 찾아갔어요.', vi: 'Đợi mãi không chịu được nên tôi trực tiếp tìm đến.' },
      { ko: '참다 못해 결국 말해 버렸어요.', vi: 'Nhịn mãi không được nên cuối cùng nói ra.' },
    ],
    commonMistake: 'Cần hành động trước kéo dài đến giới hạn chịu đựng.',
  },
  {
    id: 'g6-goseoya',
    level: 6,
    title: '-고서야',
    formula: 'V-고서야',
    meaningVi: 'Sau khi làm rồi mới; nhấn mạnh muộn màng hoặc điều kiện cần.',
    meaningEn: 'Only after doing; emphasizes belated realization or prerequisite.',
    examples: [
      { ko: '실패하고서야 준비의 중요성을 알았어요.', vi: 'Sau khi thất bại tôi mới hiểu tầm quan trọng của chuẩn bị.' },
      { ko: '직접 경험하고서야 그 어려움을 깨달았어요.', vi: 'Tự trải nghiệm rồi tôi mới nhận ra khó khăn đó.' },
    ],
    commonMistake: 'Khác với -고 나서 trung tính; -고서야 thường nhấn “mãi sau mới”.',
  },
  {
    id: 'g6-neuni-mankeum',
    level: 6,
    title: '-느니만큼',
    formula: 'V-느니만큼 / A-(으)니만큼',
    meaningVi: 'Vì đã/ở mức như vậy nên; nêu căn cứ mạnh cho kết luận.',
    meaningEn: 'Since/as much as; gives a strong basis for a conclusion.',
    examples: [
      { ko: '책임을 맡았느니만큼 끝까지 해내야 해요.', vi: 'Vì đã nhận trách nhiệm nên phải làm đến cùng.' },
      { ko: '중요한 시험이니만큼 철저히 준비하세요.', vi: 'Vì là kỳ thi quan trọng nên hãy chuẩn bị kỹ.' },
    ],
    commonMistake: 'Trang trọng hơn -(으)니까, thường dùng trong lập luận.',
  },
]

export const TOPIK_GRAMMAR_PATTERNS: TopikGrammarPattern[] = [
  ...CORE_TOPIK_GRAMMAR_PATTERNS,
  ...EXTRA_TOPIK_GRAMMAR_PATTERNS,
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
