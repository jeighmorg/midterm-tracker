/**
 * Wikitable cells are often written as `attribute|value` or `{{template}} |value`
 * (colspan/style attributes, or a template controlling cell shading followed by
 * the actual displayed text). The real displayed value is reliably whatever
 * comes after the LAST `|` in the cell's raw wikitext.
 */
export function cellValue(rawCell) {
  const afterLastPipe = rawCell.includes('|') ? rawCell.slice(rawCell.lastIndexOf('|') + 1) : rawCell
  return afterLastPipe
    .replace(/'''?/g, '')
    .replace(/\[\[[^|\]]*\|?/g, '')
    .replace(/\]\]/g, '')
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
