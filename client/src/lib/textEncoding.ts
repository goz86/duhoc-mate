const cp1252Specials: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
}

const mojibakePattern = /Ã|Ä|Â|Æ|â|ðŸ|áº|á»|ì|ë|í/

const decodeBytes = (bytes: number[]) => {
  if (bytes.length === 0) return ''
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
  return decoded.includes('\uFFFD') ? String.fromCharCode(...bytes) : decoded
}

export const repairMojibake = (value: string) => {
  if (!mojibakePattern.test(value)) return value

  let repaired = ''
  let bytes: number[] = []

  for (const char of value) {
    const specialByte = cp1252Specials[char]
    const code = char.charCodeAt(0)

    if (specialByte !== undefined) {
      bytes.push(specialByte)
    } else if (code <= 0xff) {
      bytes.push(code)
    } else {
      repaired += decodeBytes(bytes)
      bytes = []
      repaired += char
    }
  }

  repaired += decodeBytes(bytes)

  const beforeScore = (value.match(mojibakePattern) || []).length
  const afterScore = (repaired.match(mojibakePattern) || []).length
  return afterScore < beforeScore ? repaired : value
}

export const repairHelpPostText = <T extends { username?: string; title?: string; content?: string; city?: string; contact?: string }>(post: T): T => ({
  ...post,
  username: post.username ? repairMojibake(post.username) : post.username,
  title: post.title ? repairMojibake(post.title) : post.title,
  content: post.content ? repairMojibake(post.content) : post.content,
  city: post.city ? repairMojibake(post.city) : post.city,
  contact: post.contact ? repairMojibake(post.contact) : post.contact,
})
