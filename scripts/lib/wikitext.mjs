/**
 * Wikitable cells are often written as `attribute|value` or `{{template}} |value`
 * (colspan/style attributes, or a template controlling cell shading followed by
 * the actual displayed text). The real displayed value is reliably whatever
 * comes after the LAST `|` in the cell's raw wikitext.
 */
export function cellValue(rawCell) {
  // Strip simple (non-nested) {{templates}} FIRST - a trailing decorative
  // template like {{abbr||}} has its own internal "|" that otherwise confuses
  // the last-pipe split below (hit this once: it silently ate a poll source
  // name down to "}}"). Repeat a few times to unwrap shallow nesting.
  let cell = rawCell
  for (let i = 0; i < 3; i++) cell = cell.replace(/\{\{[^{}]*\}\}/g, '')

  const afterLastPipe = cell.includes('|') ? cell.slice(cell.lastIndexOf('|') + 1) : cell
  return afterLastPipe
    .replace(/<!--.*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>.*?<\/ref>/gs, '')
    .replace(/'''?/g, '')
    .replace(/\[\[[^|\]]*\|?/g, '')
    .replace(/\]\]/g, '')
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1') // [url display text] -> display text
    .replace(/\[https?:\/\/[^\]]+\]/g, '') // bare [url] with no display text -> drop
    .trim()
}

/** Split one table-row chunk (as produced by splitRows) into its raw `|`-prefixed cells. */
export function splitCells(rowWikitext) {
  return rowWikitext
    .split(/\n\|/)
    .slice(1)
    .map(cellValue)
    .filter((c) => c.length > 0)
}
