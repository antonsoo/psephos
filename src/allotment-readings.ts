export const allotmentPages = [
  { id: "76", label: "LXII · chapter 63 · leaf 76", path: "sources/kenyon-leaf76.jpg", leaf: 76 },
  { id: "77", label: "LXIV · chapter 64 · leaf 77", path: "sources/kenyon-leaf77.jpg", leaf: 77 },
  { id: "78", label: "LXIV · chapter 65 · leaf 78", path: "sources/kenyon-leaf78.jpg", leaf: 78 },
  { id: "title", label: "Title page", path: "sources/kenyon-title.jpg", leaf: 7 },
  {
    id: "imprint",
    label: "Imprint · reprints through 1958",
    path: "sources/kenyon-imprint.jpg",
    leaf: 8,
  },
] as const;
export const allotmentReadings = [
  {
    id: "letters",
    title: "Letters within a tribe",
    reference: "63.4",
    leaf: "76",
    greek:
      "καὶ γράμμα ἓν τῶν στοιχείων μέχρι τοῦ κ· νενέμηνται γὰρ κατὰ φυλὰς δέκα μέρη οἱ δικασταί, παραπλησίως ἴσοι ἐν ἑκάστῳ τῷ γράμματι.",
    english:
      "And one letter of the alphabet up to kappa; for the jurors have been divided, tribe by tribe, into ten parts, approximately equal in number under each letter.",
    note: "This continues the description of a boxwood ticket carrying the man's own name, his father's name and deme. The letter groups are within each tribe. A–E are modern tags for five of its ten groups, not transcriptions of the Greek letters or names of five tribes. The numbered identities are invented.",
    phrases: [
      [
        "γράμμα",
        "grámma",
        "A letter. Here it labels a group of tickets, rather than a verdict or a named courtroom.",
      ],
      [
        "κατὰ φυλὰς",
        "katà phulàs",
        "Tribe by tribe. This phrase prevents us from treating the five displayed letter groups as five tribes.",
      ],
      [
        "παραπλησίως ἴσοι",
        "paraplēsíōs ísoi",
        "Approximately equal. The teaching board's completely filled equal columns are an additional simplifying assumption.",
      ],
    ],
  },
  {
    id: "inserter",
    title: "Who puts the tickets in?",
    reference: "64.2",
    leaf: "77",
    greek:
      "[κληροῦται δ᾽] οὗτος, ἵνα μὴ ἀεὶ ὁ αὐτὸς ἐμπηγνύων κακουργῇ. εἰσὶ δὲ κανονίδες [πέντε ἐ]ν ἑκάστῳ τῶν κληρωτηρίων.",
    english:
      "This man [is chosen by lot], so that the same person should not always do wrong while inserting the tickets. There are [five] ticket frames in each allotment device.",
    note: "The preceding lines call him the empēktēs and match a ticket's letter to its column's letter. Brackets retain Kenyon's supplied text, including [πέντε ἐ] where the supply crosses a word boundary. Translating klērōtērion as a device follows the material interpretation; older translations used 'balloting-room'. Letting you swap two tickets is a modern experiment, not a prescribed historical action.",
    phrases: [
      [
        "ἐμπηγνύων",
        "empēgnúōn",
        "While inserting. The person handling the physical ticket placement is part of the procedure's safeguards.",
      ],
      [
        "ἵνα μὴ",
        "hína mḕ",
        "So that not: a purpose clause. It gives the reason for choosing the inserter by lot, without proving cheating was impossible.",
      ],
      [
        "κανονίδες",
        "kanonídes",
        "Frames or strips that hold tickets. They are represented as vertical columns in the schematic.",
      ],
      [
        "κληρωτηρίων",
        "klērōtēríōn",
        "Of allotment devices, the genitive plural. A klêros is a lot.",
      ],
    ],
  },
  {
    id: "cubes",
    title: "One white cube, five tickets",
    reference: "64.3, first part",
    leaf: "77",
    greek:
      "εἰσὶ δὲ κύβοι χαλκοῖ, μέλανες καὶ λευκοί. ὅσους δ᾽ ἂν δέ[ῃ λαχεῖν] δικαστάς, τοσοῦτοι ἐμβάλλονται λευκοί, κατὰ πέντε πινάκια εἷς, οἱ δὲ μέλανες τὸν αὐτὸν τρόπον.",
    english:
      "The cubes are bronze, black and white. According to how many jurors are needed [to be selected], white cubes are put in, one for every five tickets; the black ones in the same way.",
    note: "The grouping and quota come from the text. Applying successive cubes to successive horizontal rows is the usual material interpretation, represented here by an abstract release lane. The four-, six- or eight-row board, a uniform random colour order and complete rows are explicit modern assumptions. Cube form and release hardware are not reconstructed.",
    phrases: [
      [
        "κύβοι",
        "kúboi",
        "Cubes. These are black/white selection lots, not numbered gaming dice or the pierced/solid verdict ballots.",
      ],
      [
        "χαλκοῖ",
        "khalkoî",
        "Bronze; the text identifies a material. White and black refer to the two kinds of lot.",
      ],
      [
        "κατὰ πέντε πινάκια εἷς",
        "katà pénte pinákia heîs",
        "One for every five tickets. One draw can decide a whole five-ticket row, rather than a separate coin toss per person.",
      ],
    ],
  },
  {
    id: "exception",
    title: "The inserter also counts",
    reference: "64.3, final sentence",
    leaf: "77",
    greek: "ὑπάρχει δὲ καὶ ὁ ἐμπήκτης εἰς τὸν [ἀριθμό]ν.",
    english: "The ticket inserter is also included in the [number].",
    note: "This is an important exception to a simple story in which every participant waits on a row. The inserter has already been chosen by lot. Our probability calculations cover only the ordinary tickets on the teaching board; they neither assign him a row chance nor compute the total historical jury quota. Kenyon brackets ἀριθμό, leaving the final ν outside.",
    phrases: [
      [
        "ἐμπήκτης",
        "empḗktēs",
        "Ticket inserter, the official role named in 64.2. The word describes his work, not another kind of cube.",
      ],
      [
        "καὶ",
        "kaì",
        "Also. Omitting this short sentence would erase a person whom the text counts.",
      ],
    ],
  },
  {
    id: "court",
    title: "Selected for service is not assigned to a court",
    reference: "64.4, purpose clause",
    leaf: "77",
    greek:
      "ἵν᾽ εἰς οἷον ἂν λάχῃ εἰσίῃ καὶ μὴ εἰς [οἷο]ν ἂν [βούλ]ηται, μηδ᾽ ᾖ συναγαγεῖν [εἰς] δικαστήριον οὓς ἂν βούληταί τις.",
    english:
      "So that he enters whichever court he receives by lot, rather than whichever he wishes, and so that no one can assemble in a court the men he wishes.",
    note: "The preceding lines describe drawing a lettered balanos and putting the selected man's ticket in its matching court box. That later allotment is outside this bench. 'Both selected' below means both enter the service pool, not both hear the same case. The English supplies 'court' from the context.",
    phrases: [
      [
        "λάχῃ",
        "lákhēi",
        "Receives by lot; a form of lankhánō. Selection and later court assignment are distinct stages.",
      ],
      [
        "δικαστήριον",
        "dikastḗrion",
        "A court. A row's letter groups do not name the courts to which the selected men will go.",
      ],
      [
        "βούληταί τις",
        "boúlētaí tis",
        "Someone wishes. The clause states a purpose of the procedure, not a measured guarantee of resistance to every manipulation.",
      ],
    ],
  },
] as const;
