import { Box, Diagram } from "./parts";
import { Arrow, Decision, SideNote } from "./decision";

/**
 * The enrichment meter that counted cache hits as cash: /v1/recall_and_enrich
 * emits recall, then fills sourcesCalled from either a cache hit or a live
 * vendor race. The enrichment_query meter read sourcesCalled, so a cache hit
 * (zero vendor calls) counted as a vendor lookup. Side note: the fix gates the
 * meter on !cacheHit.
 *
 * Nodes for <StepThrough highlight="…">: request, recall, cache, hit, cached,
 * miss, live, leak, fill, sources, read, meter, fix.
 */
export function CacheHitMeterDiagram() {
  return (
    <Diagram
      height={624}
      title="How a cache hit reached the enrichment meter"
      desc="A request to /v1/recall_and_enrich emits the recall meter. Is the enrichment cached? Hit: the cache answers with no vendor call. Miss: a live vendor race, Trestle and Twilio. Either path fills sourcesCalled. The enrichment_query meter reads sourcesCalled, so it fires on cache hits too. Side note, the fix: the meter is gated on !cacheHit, so a cache hit emits recall only."
    >
      <Box node="request" x={30} y={12} w={260} h={60} title="Recall request" sub="/v1/recall_and_enrich" />
      <Arrow node="recall" x={160} y1={72} y2={108} label="emits recall" />
      <Decision node="cache" cx={160} y={108} hw={78} hh={44} lines={["Enrichment", "cached?"]} />

      <Arrow node="hit" x={82} y1={152} y2={228} label="hit" side="left" />
      <Box node="cached" x={10} y={228} w={145} h={60} title="Cache" sub="no vendor call" />
      <Arrow node="miss" x={238} y1={152} y2={228} label="miss" />
      <Box node="live" x={165} y={228} w={145} h={60} title="Vendor race" sub="Trestle / Twilio" />

      <Arrow node="leak" x={82} y1={288} y2={336} tone="clay" />
      <Arrow node="fill" x={238} y1={288} y2={336} />
      <Box node="sources" x={30} y={336} w={260} h={60} title="sourcesCalled" sub="filled by either path" />
      <Arrow node="read" x={160} y1={396} y2={432} label="read by the meter" tone="clay" />
      <Box node="meter" x={30} y={432} w={260} h={60} title="enrichment_query" sub="fires on cache hits too" />

      <SideNote
        node="fix"
        x={10}
        y={516}
        w={300}
        eyebrow="THE FIX · GATE ON !cacheHit"
        lines={["The meter reads !cacheHit, not", "sourcesCalled. A cache hit emits", "recall only."]}
      />
    </Diagram>
  );
}
