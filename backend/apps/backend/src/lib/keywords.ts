const STOP = new Set(
  "i im i'm me my we a an the and or but with without of for to in on at it its is are be really very quite so some something anything kind sort like likes love loves loving want wants looking look smell smells smelling scent scents perfume perfumes fragrance fragrances note notes that this those these please more most bit little lot lots strong light ones one type types prefer into enjoy".split(
    " "
  )
)

/** The meaningful words in a shopper's search, singular and lower-case, for the owner's report. */
export function keywordsOf(q: string): string[] {
  const words = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w))
  return [...new Set(words)].slice(0, 12)
}
