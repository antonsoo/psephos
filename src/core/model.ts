export type Ballot = "pierced" | "solid";
export type Preset = "last-vote" | "wooden-urn" | "empty";
export type Urn = "bronze" | "wood";
export type Intervention = "none" | "extra" | "replace";
export type Pair = "mixed" | "two-pierced" | "two-solid";
export type Action =
  | { type: "issue"; pair: Pair }
  | { type: "choose"; ballot: Ballot }
  | { type: "cover"; covered: boolean }
  | { type: "cast" }
  | { type: "count"; urn: Urn }
  | { type: "intervene"; kind: Intervention };

export interface Court {
  votes: Ballot[];
  issued: boolean;
  choice: Ballot;
  covered: boolean;
  counted: Urn | null;
  intervention: Intervention;
}
export interface Step {
  court: Court;
  accepted: boolean;
  message: string;
  source: string;
}
export const PANEL = 10;
export const opposite = (ballot: Ballot): Ballot => (ballot === "pierced" ? "solid" : "pierced");
export const side = (ballot: Ballot): string =>
  ballot === "pierced" ? "first speaker / prosecutor" : "second speaker / defendant";

export function initial(preset: Preset): Court {
  // These are invented previous votes, not a historical case or jury size.
  const votes: Ballot[] =
    preset === "empty"
      ? []
      : [
          ...Array<Ballot>(preset === "last-vote" ? 5 : 3).fill("pierced"),
          ...Array<Ballot>(preset === "last-vote" ? 4 : 6).fill("solid"),
        ];
  return {
    votes,
    issued: false,
    choice: "solid",
    covered: true,
    counted: null,
    intervention: "none",
  };
}

export function step(court: Court, action: Action): Step {
  const result = (accepted: boolean, message: string, source: string, next = court): Step => ({
    court: next,
    accepted,
    message,
    source,
  });
  switch (action.type) {
    case "issue":
      if (court.votes.length === PANEL)
        return result(
          false,
          "All ten training jurors have cast. Start another rehearsal to issue a pair.",
          "pair",
        );
      if (action.pair !== "mixed")
        return result(
          false,
          "Refuse this pair: each juror must receive one pierced and one solid ballot, shown to both litigants.",
          "pair",
        );
      if (court.issued)
        return result(
          false,
          "This juror already has a pair. Choose one ballot for bronze.",
          "pair",
        );
      return result(
        true,
        "One pierced and one solid ballot received. Choose the one that will count.",
        "pair",
        { ...court, issued: true },
      );
    case "choose":
      if (!court.issued)
        return result(false, "Receive a valid pair before choosing a ballot.", "pair");
      return result(
        true,
        `The ${action.ballot} ballot is selected for bronze. The other goes into wood.`,
        "grip",
        { ...court, choice: action.ballot },
      );
    case "cover":
      return result(
        true,
        action.covered
          ? "Both axle ends are covered in the observer drawing."
          : "The axle ends are exposed. The observer can now distinguish the selected ballot.",
        "grip",
        { ...court, covered: action.covered },
      );
    case "cast": {
      if (court.votes.length >= PANEL)
        return result(false, "The training panel is complete. Count an urn.", "count");
      if (!court.issued)
        return result(false, "This juror needs one pierced and one solid ballot first.", "pair");
      return result(
        true,
        `Juror ${court.votes.length + 1}: ${court.choice} into bronze; ${opposite(court.choice)} into wood.`,
        "grip",
        {
          ...court,
          votes: [...court.votes, court.choice],
          issued: false,
          counted: null,
          intervention: "none",
        },
      );
    }
    case "count":
      if (court.votes.length !== PANEL)
        return result(
          false,
          "Let every training juror cast before opening the count. The verdict is held back in this exercise.",
          "count",
        );
      return result(
        true,
        action.urn === "bronze"
          ? "The counted urn is open. Separate pierced from solid ballots."
          : "These are the unused ballots. This urn does not decide the case.",
        "urns",
        { ...court, counted: action.urn },
      );
    case "intervene":
      if (court.counted !== "bronze")
        return result(
          false,
          "Open the bronze count before trying a modern counting intervention.",
          "count",
        );
      if (action.kind === "replace" && !court.votes.includes("solid"))
        return result(
          false,
          "There is no solid ballot in this count to replace. Try a rehearsal with a solid vote.",
          "count",
        );
      return result(
        true,
        action.kind === "none"
          ? "Original count restored."
          : action.kind === "extra"
            ? "One additional pierced ballot has been inserted in the modern counting exercise."
            : "One solid ballot has been replaced by a pierced ballot in the modern counting exercise.",
        "count",
        { ...court, intervention: action.kind },
      );
  }
}

export function replay(
  preset: Preset,
  actions: readonly Action[],
): { court: Court; steps: Step[] } {
  let court = initial(preset);
  const steps = actions.map((action) => {
    const next = step(court, action);
    court = next.court;
    return next;
  });
  return { court, steps };
}

export function contents(court: Court, urn: Urn, intervention = court.intervention): Ballot[] {
  if (urn === "wood") return court.votes.map(opposite);
  const ballots = [...court.votes];
  if (intervention === "extra") ballots.push("pierced");
  if (intervention === "replace") {
    const index = ballots.indexOf("solid");
    if (index >= 0) ballots[index] = "pierced";
  }
  return ballots;
}

export function tally(ballots: readonly Ballot[]): {
  pierced: number;
  solid: number;
  winner: "prosecutor" | "defendant";
  tied: boolean;
} {
  const pierced = ballots.filter((ballot) => ballot === "pierced").length;
  const solid = ballots.length - pierced;
  return {
    pierced,
    solid,
    winner: pierced > solid ? "prosecutor" : "defendant",
    tied: pierced === solid,
  };
}

export function observer(covered: boolean, choice: Ballot): string {
  return covered
    ? "Both axle ends covered; the selected ballot cannot be distinguished in this drawing."
    : `Exposed ${choice} axle; selected ballot for the ${side(choice)}.`;
}
