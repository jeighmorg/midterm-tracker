// Best-effort parsing of Wikipedia's {{Infobox election}} candidate fields.
// Real election articles are messy (missing nominees, inline comments, refs,
// occasional third-party rows) — this fails soft (returns undefined fields)
// rather than throwing, consistent with the rest of the pipeline.

function cleanValue(raw) {
  if (!raw) return undefined
  let text = raw
    .replace(/<!--.*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>.*?<\/ref>/g, '')
    .trim()
  // [[Target|Display]] -> Display, [[Display]] -> Display
  const piped = /^\[\[[^|\]]*\|([^\]]+)\]\]$/.exec(text)
  if (piped) text = piped[1]
  else {
    const plain = /^\[\[([^\]]+)\]\]$/.exec(text)
    if (plain) text = plain[1]
  }
  text = text.trim()
  return text.length > 0 ? text : undefined
}

function normalizeParty(raw) {
  const cleaned = cleanValue(raw)
  if (!cleaned) return undefined
  if (cleaned.startsWith('Democratic') || cleaned.includes('Farmer')) return 'D'
  if (cleaned.startsWith('Republican')) return 'R'
  if (cleaned.startsWith('Independent')) return 'I'
  return cleaned
}

/**
 * Extract the top two candidates from a chunk of wikitext containing (at
 * least) one {{Infobox election}} — takes the first occurrence of each
 * field, which is the general-election infobox in every case observed.
 */
export function extractCandidates(chunk) {
  // Infobox fields are one per line ("| field = value"), so capturing to
  // end-of-line is correct and necessary - a piped wikilink's own "|"
  // ([[Target|Display]]) must NOT terminate the match.
  const field = (name) => new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n]*)`).exec(chunk)?.[1]

  const name1 = cleanValue(field('candidate1') ?? field('nominee1'))
  const party1 = normalizeParty(field('party1'))
  const name2 = cleanValue(field('candidate2') ?? field('nominee2'))
  const party2 = normalizeParty(field('party2'))

  const candidates = []
  if (name1) candidates.push({ name: name1, party: party1 })
  if (name2) candidates.push({ name: name2, party: party2 })
  return candidates
}
