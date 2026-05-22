import type { RoomTemplate } from './communityTemplates'

export const seedRoomIds = new Set(['TOPIK30', 'KOREALIFE', 'LISTENKR', 'JOBKR', 'EVENING', 'SAVINGS'])

// Mỗi template hệ thống có mã phòng cố định để người dùng có thể quay lại dễ dàng.
export const getTemplateRoomId = (template: RoomTemplate) => {
  const fixedIds: Record<string, string> = {
    'seed-topik-30': 'TOPIK30',
    'seed-korea-checklist': 'KOREALIFE',
    'seed-listening': 'LISTENKR',
    'seed-job': 'JOBKR',
    'seed-evening': 'EVENING',
    'seed-savings': 'SAVINGS',
  }

  if (fixedIds[template.id]) return fixedIds[template.id]
  return template.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase() || template.id.slice(0, 8).toUpperCase()
}
