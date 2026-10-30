# Audit of Psephos

The initial local edition was `3c2c1e5`. This audit starts from that checkout
and reopens its evidence rather than treating a prior passing receipt as proof.

## A source failure contradicted the readiness footer

With the worker controlling the page and its full inventory initially retained,
the audit set each browser offline, damaged the source in the exact named cache,
and pressed Reload page. The source viewer refused it, but the footer still
said every source page was available. This was reproduced in Chromium and
Firefox. The earlier driver had manually dispatched `visibilitychange` before
checking readiness, which concealed the missing automatic update.

[Observed before](audit/readiness-before.json) ·
[Observed after](audit/readiness-after.json) ·
[Independent offline/update audit](audit/offline.json).

Verified asset failures now trigger an inventory check; the footer withdraws
its affirmative claim while that check runs. The worker separately notifies
its controlled pages when ordinary image/file requests discover missing or
damaged storage. Only the current controller and matching edition can cause
that notification to be accepted. Canceled source requests do not cause an
integrity warning.

`npm run test:audit` verifies the fix without a synthetic inventory event. It
also tests another cache holding a healthy copy, an uncached navigation, recovery
when the real origin returns, and a two-edition transition. Edition A keeps its
own files while B waits. After A's last page closes, B activates, old caches are
removed, and the saved explanation reopens. This is separate from a browser's
simulated offline flag and from a successful initial installation.
