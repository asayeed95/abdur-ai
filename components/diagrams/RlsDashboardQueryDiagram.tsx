import { Box, Diagram } from "./parts";
import { Arrow, Decision } from "./decision";

/**
 * The dashboard query RLS wouldn't let through: select('*') expands to every
 * column at parse time, and Postgres checks column privilege before it filters
 * a single row. Two ungranted columns (after migration 031) make the whole
 * query fail with 42501, and an earlier guard (PR 410) turns that into a retry screen.
 * The explicit grant-list select (the #433 fix) passes the check and reaches
 * the row filter.
 *
 * Nodes for <StepThrough highlight="…">: load, parse, expand, check, decide,
 * yes, filter, to-row, row, no, deny, to-guard, guard.
 */
export function RlsDashboardQueryDiagram() {
  return (
    <Diagram
      height={488}
      title="Why select('*') failed after migration 031"
      desc="A dashboard page load runs select('*') on the tenants table. At parse time Postgres expands the star to every column, including tenant_secret and api_key_hash, and checks each column against migration 031's grant list before it filters any row. Every column granted: the row filter runs and the tenant row comes back. Any column not granted: error 42501, permission denied, and an earlier guard shows a retry screen instead."
    >
      <Box node="load" x={30} y={12} w={260} h={60} title="Dashboard page load" sub="select('*') on tenants" />
      <Arrow node="parse" x={160} y1={72} y2={108} label="parse time" />
      <Box node="expand" x={30} y={108} w={260} h={60} title="Expand * to every column" sub="tenant_secret, api_key_hash too" />
      <Arrow node="check" x={160} y1={168} y2={200} label="031 grant list" />
      <Decision node="decide" cx={160} y={200} hw={78} hh={44} lines={["Every column", "granted?"]} />

      <Arrow node="yes" x={82} y1={244} y2={320} label="yes" side="left" tone="good" />
      <Box node="filter" x={10} y={320} w={145} h={60} title="Row filter (RLS)" sub="per-row policy" />
      <Arrow node="to-row" x={82} y1={380} y2={416} tone="good" />
      <Box node="row" x={10} y={416} w={145} h={60} title="Tenant row" sub="returned" />

      <Arrow node="no" x={238} y1={244} y2={320} label="no" tone="clay" />
      <Box node="deny" x={165} y={320} w={145} h={60} title="42501" sub="permission denied" />
      <Arrow node="to-guard" x={238} y1={380} y2={416} tone="clay" />
      <Box node="guard" x={165} y={416} w={145} h={60} title="Retry screen" sub="my earlier guard" />
    </Diagram>
  );
}
