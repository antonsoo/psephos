import { type Ballot, PANEL } from "./model";

export interface KnownVote {
  juror: number;
  ballot: Ballot;
}
export interface Knowledge {
  target: number;
  known: number[];
  inspected: boolean;
}
export const initialKnowledge = (): Knowledge => ({
  target: PANEL - 1,
  known: [],
  inspected: false,
});

export interface Inference {
  total: number;
  pierced: number;
  solid: number;
  piercedWitness: Ballot[] | null;
  solidWitness: Ballot[] | null;
  unknown: number;
  remainingPierced: number;
}

// Each of ten labeled training jurors contributes one of two choices. The
// labels are a modern reasoning aid, not marks on the historical ballots.
export function inferVote(pierced: number, target: number, known: readonly KnownVote[]): Inference {
  if (
    !Number.isInteger(pierced) ||
    pierced < 0 ||
    pierced > PANEL ||
    !Number.isInteger(target) ||
    target < 0 ||
    target >= PANEL
  )
    throw new Error("Choose a valid ten-juror count and target.");
  const conditions = new Map<number, Ballot>();
  for (const fact of known) {
    if (
      !Number.isInteger(fact.juror) ||
      fact.juror < 0 ||
      fact.juror >= PANEL ||
      !["pierced", "solid"].includes(fact.ballot) ||
      conditions.has(fact.juror)
    )
      throw new Error("Each known juror needs one unambiguous ballot choice.");
    conditions.set(fact.juror, fact.ballot);
  }
  const result: Inference = {
    total: 0,
    pierced: 0,
    solid: 0,
    piercedWitness: null,
    solidWitness: null,
    unknown: PANEL - conditions.size,
    remainingPierced: pierced - known.filter((fact) => fact.ballot === "pierced").length,
  };
  for (let mask = 0; mask < 2 ** PANEL; mask++) {
    const votes: Ballot[] = Array.from({ length: PANEL }, (_, i) =>
      mask & (1 << i) ? "pierced" : "solid",
    );
    if (
      votes.filter((v) => v === "pierced").length !== pierced ||
      known.some((fact) => votes[fact.juror] !== fact.ballot)
    )
      continue;
    result.total++;
    if (votes[target] === "pierced") {
      result.pierced++;
      result.piercedWitness ??= votes;
    } else {
      result.solid++;
      result.solidWitness ??= votes;
    }
  }
  return result;
}
