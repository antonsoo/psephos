export interface Phrase {
  greek: string;
  transliteration: string;
  meaning: string;
}
export interface Reading {
  id: string;
  title: string;
  reference: string;
  page: "LXVII" | "LXVIII";
  image: string;
  greek: string;
  english: string;
  note: string;
  phrases: Phrase[];
}
export const readings: Reading[] = [
  {
    id: "pair",
    title: "One of each",
    reference: "68.2, opening",
    page: "LXVII",
    image: "sources/kenyon-p67.jpg",
    greek:
      "ψῆφοι δέ εἰσιν χαλκαῖ, αὐλίσκον ἔχουσαι ἐν τῷ μέσῳ, αἱ μὲν ἡμίσειαι τετρυπημέναι, αἱ δὲ ἡμίσειαι πλήρεις. οἱ δὲ λαχόντες ἐπὶ τὰς ψήφους, ἐπειδὰν εἰρημένοι ὦσιν οἱ λόγοι, παραδιδόασιν ἑκάστῳ τῶν δικαστῶν δύο ψήφους, τετρυπημένην καὶ πλήρη, φανερὰς ὁρᾶν τοῖς ἀντιδίκοις, ἵνα μήτε πλήρεις μήτε τετρυπημένας ἀμφοτέρας λαμβάνωσι.",
    english:
      "The ballots are bronze, with a little tube in the middle: half are pierced, half solid. When the speeches have been delivered, the officials allotted to the ballots hand each juror two ballots, one pierced and one solid, in plain view of the opposing parties, so that jurors receive neither two solid ones nor two pierced ones.",
    note: "The pair is shown openly before the choice is concealed. This selection ends before the damaged passage about pay-tokens. The editor's sentence punctuation is rendered with a modern full stop.",
    phrases: [
      {
        greek: "ψῆφοι",
        transliteration: "psêphoi",
        meaning:
          "Ballots; plural of ψῆφος. The word can also mean a pebble used in counting or voting. Here the text explicitly says bronze.",
      },
      {
        greek: "αὐλίσκον",
        transliteration: "aulískon",
        meaning:
          "A little tube. Its two ends are the distinguishing feature that the grip conceals.",
      },
      {
        greek: "τετρυπημέναι",
        transliteration: "tetrupēménai",
        meaning:
          "Having been pierced: a perfect passive participle describing the resulting physical state. The ballot is not inscribed with a candidate's name.",
      },
      {
        greek: "πλήρεις",
        transliteration: "plḗreis",
        meaning: "Full or solid. In this context the axle has no through-hole.",
      },
      {
        greek: "φανερὰς",
        transliteration: "phaneràs",
        meaning:
          "Visible, in plain view. The parties inspect what is issued; this is a different moment from watching a concealed vote.",
      },
      {
        greek: "ἵνα μήτε",
        transliteration: "hína mḗte",
        meaning: "So that neither… The purpose clause explains why showing the pair matters.",
      },
    ],
  },
  {
    id: "urns",
    title: "Only bronze counts",
    reference: "68.3, final clause",
    page: "LXVII",
    image: "sources/kenyon-p67.jpg",
    greek:
      "ὁ μὲν χαλκοῦς κύριος, ὁ δὲ ξύλινος ἄκυρος, ἔχων ὁ χαλκοῦς ἐπίθημα διερρινημένον, ὥστ’ αὐτὴν μόνην χωρεῖν τὴν ψῆφον, ἵνα μὴ δύο ὁ αὐτὸς [ἐμβάλλῃ].",
    english:
      "The bronze one is authoritative; the wooden one has no authority. The bronze one has a lid with a filed opening, so that only the ballot itself fits, to prevent the same person from putting in two.",
    note: "The implied nouns are the two urns named earlier in 68.3. Square brackets preserve Kenyon's editorial supply [ἐμβάλλῃ]. The drawing uses schematic vessels: it is not evidence of their precise shape. A narrow opening is a stated precaution, not a proof that fraud was impossible.",
    phrases: [
      {
        greek: "χαλκοῦς",
        transliteration: "khalkoûs",
        meaning:
          "Bronze. It distinguishes the material of the authoritative urn, not the side supported by a vote.",
      },
      {
        greek: "κύριος",
        transliteration: "kúrios",
        meaning:
          "Authoritative or effective. Both pierced and solid ballots can be authoritative when placed in this urn.",
      },
      {
        greek: "ξύλινος",
        transliteration: "xúlinos",
        meaning: "Wooden. The unchosen ballot goes here whatever the juror's choice was.",
      },
      {
        greek: "ἄκυρος",
        transliteration: "ákuros",
        meaning:
          "Without authority, not counting. This does not mean that the ballot itself is broken or malformed.",
      },
      {
        greek: "μόνην",
        transliteration: "mónēn",
        meaning:
          "Alone or only. The slot admits the ballot by itself; the text gives this as a precaution against putting in two.",
      },
    ],
  },
  {
    id: "grip",
    title: "The concealed choice",
    reference: "68.4, after the evidence challenge",
    page: "LXVIII",
    image: "sources/kenyon-p68.jpg",
    greek:
      "ἔπειτα πάλιν ἀνακηρύττει· ‘ἡ τετρυπημένη τοῦ πρότερον λέγοντος, ἡ δὲ πλήρης τοῦ ὕστερον λέγοντος.’ ὁ δὲ δικαστὴς λα[βὼν ἅμα] ἐκ τοῦ λυχνείου τὰς ψήφους, πιέζων τὸν [αὐλίσκον] τῆς ψήφου καὶ οὐ δεικνύων τοῖς ἀγωνιζομένοις οὔτε τὸ τετρυπημένον οὔτε τὸ πλῆρες, ἐμβάλλει τὴν μὲν κυρίαν εἰς τὸν χαλκοῦν ἀμφορέα, τὴν δὲ ἄκυρον εἰς τὸν ξύλινον.",
    english:
      "Then the herald proclaims again: ‘The pierced one for the first speaker, the solid one for the later speaker.’ The juror [takes both ballots together] from the stand, grips the ballot's [little tube], and shows the litigants neither the pierced nor the solid end. He puts the effective ballot into the bronze urn, the ineffective one into the wooden urn.",
    note: "The herald is the subject supplied from the preceding sentence. λα[βὼν ἅμα] and [αὐλίσκον] retain the printed editor’s supplies. The diagram isolates the ends as seen by a spectator; it does not simulate every sight line, texture, or possible clue. This app records private choices for learning and is not a private voting system.",
    phrases: [
      {
        greek: "πρότερον λέγοντος",
        transliteration: "próteron légontos",
        meaning:
          "Of the one speaking first. The herald initially defines the choice by speaking order.",
      },
      {
        greek: "ὕστερον λέγοντος",
        transliteration: "hústeron légontos",
        meaning:
          "Of the one speaking later: the opposing side. In 69.1 the sides are named as prosecutor and defendant.",
      },
      {
        greek: "πιέζων",
        transliteration: "piézōn",
        meaning:
          "Pressing or gripping. This physical act conceals the difference between the axle ends.",
      },
      {
        greek: "οὐ δεικνύων",
        transliteration: "ou deiknúōn",
        meaning:
          "Not showing. The same juror's hands conceal both ends, rather than marking a third kind of ballot.",
      },
      {
        greek: "κυρίαν",
        transliteration: "kurían",
        meaning:
          "The effective one. The selected ballot is defined by where it is placed; pierced is not inherently the effective kind.",
      },
    ],
  },
  {
    id: "count",
    title: "Make the count visible",
    reference: "69.1, opening",
    page: "LXVIII",
    image: "sources/kenyon-p68.jpg",
    greek:
      "πάντες δ’ ἐπειδὰν ὦσι διε[ψηφισ]μένοι, λαβόντες οἱ ὑπηρέται τὸν ἀμφορέα τὸν κύριον, ἐξερῶσιν ἐπὶ ἄβακα τρυπήματα ἔχοντα ὅσαιπερ εἰσὶν αἱ ψῆφοι, καὶ ταῦτα ὅ[πως] αἱ κυρίαι προκείμεναι εὐαρίθμητοι ὦσιν, καὶ τὰ τρυπητὰ καὶ τὰ πλήρη, [[δηλονότι τοῖς ἀντιδίκοις]].",
    english:
      "When everyone has [finished voting], the attendants take the authoritative urn and empty it onto a board with as many holes as there are ballots. This is [so that] the effective ballots, laid out, may be easy to count, both pierced and solid, [[plainly, to the opposing parties]].",
    note: "The supplies διε[ψηφισ]μένοι and ὅ[πως] follow the print. Kenyon puts the final phrase in double brackets; the apparatus treats it as a gloss to exclude. The English preserves that distinction. The training board’s two-by-five layout is new.",
    phrases: [
      {
        greek: "πάντες",
        transliteration: "pántes",
        meaning:
          "Everyone. This is why the exercise holds back the count while a training juror has yet to vote.",
      },
      {
        greek: "ἄβακα",
        transliteration: "ábaka",
        meaning:
          "A board or counting surface; accusative of ἄβαξ. Here its holes make the ballots visible for counting.",
      },
      {
        greek: "τρυπήματα",
        transliteration: "trupḗmata",
        meaning: "Holes in the board. Do not confuse these with the holes in some ballot axles.",
      },
      {
        greek: "εὐαρίθμητοι",
        transliteration: "eu aríthmētoi",
        meaning:
          "Easy to count. The arrangement exposes the aggregate result while the casting grip conceals an individual's choice.",
      },
    ],
  },
  {
    id: "tie",
    title: "When the votes are equal",
    reference: "69.1, verdict clause",
    page: "LXVIII",
    image: "sources/kenyon-p68.jpg",
    greek:
      "καὶ ἀναγορεύει ὁ κήρυξ τὸν [ἀριθμὸν] τῶν ψήφων, τοῦ μὲν διώκοντος τὰς τετρυπημένας, τοῦ δὲ φεύγοντος τὰς πλήρεις· ὁποτέρῳ δ’ ἂν πλείων γένηται, οὗτος νικᾷ, ἂν δὲ ἴσαι, ὁ φεύγων.",
    english:
      "The herald announces the [number] of votes: pierced for the prosecutor, solid for the defendant. Whichever side gets the greater number wins; but if they are equal, the defendant wins.",
    note: "[ἀριθμὸν] retains the editorial supply. The last clause omits the repeated verb ‘wins’. The app gives a verdict only within this described counting procedure. It does not judge the merits of a real dispute or model the separate penalty assessment of 69.2.",
    phrases: [
      {
        greek: "διώκοντος",
        transliteration: "diṓkontos",
        meaning:
          "Of the pursuer or prosecutor. The participle names a legal role, not a claim that the prosecution is correct.",
      },
      {
        greek: "φεύγοντος",
        transliteration: "pheúgontos",
        meaning:
          "Of the defendant: literally ‘the one fleeing’. Legal context gives this familiar verb its technical role.",
      },
      {
        greek: "πλείων",
        transliteration: "pleíōn",
        meaning:
          "Greater in number, referring to ψῆφος or the vote. A prosecution win requires strictly more pierced ballots.",
      },
      {
        greek: "ἂν δὲ ἴσαι",
        transliteration: "àn dè ísai",
        meaning:
          "But if [the votes are] equal. ἴσαι is feminine plural, matching the understood ψῆφοι. Equal is not ‘more than half’.",
      },
      {
        greek: "ὁ φεύγων",
        transliteration: "ho pheúgōn",
        meaning:
          "The defendant [wins]. The last words settle the five-to-five training count without another ballot.",
      },
    ],
  },
];
export function reading(id: string): Reading {
  const result = readings.find((item) => item.id === id);
  if (!result) throw new Error(`Unknown reading: ${id}`);
  return result;
}
