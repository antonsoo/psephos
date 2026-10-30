import { inferVote, type Knowledge } from "./core/inference";
import { type Ballot, type Court, PANEL, tally } from "./core/model";
import { escapeHtml } from "./drawing";

export function inferenceAvailable(court: Court): boolean {
  return (
    court.votes.length === PANEL && court.counted === "bronze" && court.intervention === "none"
  );
}
function assignment(votes: readonly Ballot[], target: number, label: string): string {
  const description = votes
    .map((v, i) => `Juror ${i + 1}: ${v}${i === target ? ", target" : ""}`)
    .join("; ");
  const pieces = votes
    .map((v, i) => {
      const x = 47 + (i % 5) * 82,
        y = 52 + Math.floor(i / 5) * 100;
      return `<g transform="translate(${x} ${y})"><circle r="26" fill="#a88a53" stroke="#4d482c" stroke-width="1.5"/><circle r="9" fill="${v === "pierced" ? "#153d39" : "#b99c65"}" stroke="#4d482c" stroke-width="1.5"/>${i === target ? '<path d="M-26 35H26" stroke="#98394a" stroke-width="4"/>' : ""}<text y="59" text-anchor="middle" fill="#153d39" font-family="Source Sans 3, sans-serif" font-size="17">J${i + 1}${i === target ? "*" : ""}</text></g>`;
    })
    .join("");
  return `<figure class="assignment"><figcaption>${escapeHtml(label)}: target ${votes[target]}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 422 220" role="img" aria-label="${escapeHtml(description)}"><rect x="1" y="1" width="420" height="218" rx="14" fill="#f6fbf8" stroke="#b7cdc1"/>${pieces}</svg><p class="small">* Target juror. Holes mean pierced; closed centers mean solid.</p></figure>`;
}
export function inferenceReport(court: Court, knowledge: Knowledge): string {
  if (!inferenceAvailable(court))
    return `<h3>The original bronze count is needed.</h3><p>Complete the training panel and open bronze. Restore the original count if you are trying a counting intervention. This investigation assumes that one faithful count records one ballot from each juror.</p>`;
  const target = knowledge.target + 1;
  const known = knowledge.known.map((juror) => ({ juror, ballot: court.votes[juror] as Ballot }));
  const assumptions = known.length
    ? known.map((fact) => `Juror ${fact.juror + 1}: ${fact.ballot}`).join("; ")
    : "No other juror’s choice is assumed known.";
  const count = tally(court.votes);
  const introduction = `<p><strong>Public count:</strong> ${count.pierced} pierced, ${count.solid} solid. <strong>Target:</strong> Juror ${target}.</p><p><strong>Assumed knowledge:</strong> ${escapeHtml(assumptions)}</p>`;
  if (!knowledge.inspected)
    return `${introduction}<p>Inspect the compatible arrangements to see whether both choices remain possible for Juror ${target}.</p>`;
  const result = inferVote(count.pierced, knowledge.target, known);
  const title =
    result.pierced && result.solid
      ? `Both choices remain possible for Juror ${target}.`
      : result.total
        ? `Juror ${target}’s choice is forced: ${result.pierced ? "pierced" : "solid"}.`
        : "These assumptions contradict the count.";
  const evidence =
    result.pierced && result.solid
      ? "The two arrangements below satisfy the same count and every marked assumption, but give the target different ballots. The visible total alone does not decide between them."
      : result.total
        ? "Every compatible arrangement gives the target the same ballot. The grip can hide a choice during casting without preventing this deduction from the final count and the assumptions."
        : "No assignment satisfies both the given count and these facts.";
  const witness = [
    result.piercedWitness
      ? assignment(result.piercedWitness, knowledge.target, "Compatible arrangement A")
      : "",
    result.solidWitness
      ? assignment(
          result.solidWitness,
          knowledge.target,
          result.piercedWitness ? "Compatible arrangement B" : "Compatible arrangement A",
        )
      : "",
  ].join("");
  const unanimity =
    (count.pierced === 0 || count.solid === 0) && known.length === 0
      ? "<p><strong>Unanimity is enough:</strong> this total already fixes every choice. No other individual vote needs to be assumed known.</p>"
      : "";
  return `${introduction}<h3>${title}</h3><p><strong>${result.total} ${result.total === 1 ? "arrangement fits" : "arrangements fit"} these facts.</strong> ${evidence}</p>${unanimity}<table><caption>Choices still possible for Juror ${target}</caption><thead><tr><th scope="col">Target’s ballot</th><th scope="col">Compatible arrangements</th></tr></thead><tbody><tr><th scope="row">Pierced</th><td>${result.pierced}</td></tr><tr><th scope="row">Solid</th><td>${result.solid}</td></tr></tbody></table><div class="assignment-pair">${witness}</div><details class="inference-proof"><summary>Why this count is complete</summary><p>Each of ten labeled teaching jurors has two choices, so there are 2<sup>10</sup> = 1,024 assignments. Keep only those with ${count.pierced} pierced ballots and every assumed known choice. There are ${result.total} left.</p><p>Equivalently, ${result.remainingPierced} of the ${result.unknown} unassigned jurors must supply the remaining pierced ballots. Choose that many positions; all other positions are solid. The displayed witnesses illustrate the result; the enumeration checks every assignment.</p><p>These are logical possibilities, not probabilities. No claim is made that human choices are equally likely. Juror labels and assumed knowledge are modern reasoning tools, not marks on ancient ballots.</p></details>`;
}
