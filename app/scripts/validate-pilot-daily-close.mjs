import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const columns = ["date","shop_open_time","shop_close_time","operating_day","pilot_phase","release_segment","app_recorded_real_queue_count","off_app_fallback_count","fallback_later_entered_count","reconciled_real_queue_total","fallback_used","fallback_reason","fallback_category_version","safety_incident","repeated_questions_observed","owner_queue_minutes_observed","observation_source","owner_confidence_1_5","primary_problem_category","primary_problem_summary_no_pii","collector","collection_method","denominator_confidence","reconciliation_closed_at","trustworthy_data_day","trustworthy_exclusion_reason","close_duration_seconds","missing_fields","corrects_date","correction_reason"];
const enums = {
  boolean: new Set(["true", "false"]),
  fallback_reason: new Set(["", "PAPER", "LINE_LIST", "PHONE_NOTE", "MEMORY", "APP_DOWN", "OWNER_PREFERENCE", "OTHER"]),
  collection_method: new Set(["SYSTEM_REPORT", "OPERATOR_OBSERVATION", "OWNER_REPORT"]),
  denominator_confidence: new Set(["HIGH", "MEDIUM", "LOW"]),
  trustworthy_exclusion_reason: new Set(["", "CLOSED", "RECONCILIATION_INCOMPLETE", "SAFETY_INCIDENT", "RELEASE_CHANGE", "MISSING_REQUIRED_DATA", "OTHER"]),
};
const forbidden = /(https?:\/\/|line user|token|pin|phone|โทร|เบอร์|ชื่อลูกค้า)/i;

const parseCsvLine = (line) => {
  const cells = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  if (quoted) throw new Error("Unclosed CSV quote.");
  cells.push(value);
  return cells;
};

const main = async () => {
  const file = resolve(process.argv[2] ?? new URL("../../docs/templates/pilot-daily-close-r1.csv", import.meta.url).pathname);
  const lines = (await readFile(file, "utf8")).trimEnd().split(/\r?\n/);
  const header = parseCsvLine(lines[0] ?? "");
  if (JSON.stringify(header) !== JSON.stringify(columns)) throw new Error("Daily Close header does not match schema r1 exactly.");
  for (let index = 1; index < lines.length; index += 1) {
    if (!lines[index].trim()) continue;
    const cells = parseCsvLine(lines[index]);
    if (cells.length !== columns.length) throw new Error(`Row ${index + 1} has ${cells.length} cells; expected ${columns.length}.`);
    const row = Object.fromEntries(columns.map((column, cell) => [column, cells[cell].trim()]));
    for (const key of ["operating_day", "fallback_used", "safety_incident", "trustworthy_data_day"]) if (!enums.boolean.has(row[key])) throw new Error(`Row ${index + 1}: ${key} must be true or false.`);
    for (const key of ["fallback_reason", "collection_method", "denominator_confidence", "trustworthy_exclusion_reason"]) if (!enums[key].has(row[key])) throw new Error(`Row ${index + 1}: invalid ${key}.`);
    if (row.fallback_category_version !== "pilot-r1-v1") throw new Error(`Row ${index + 1}: invalid fallback category version.`);
    if (row.owner_confidence_1_5 && !/^[1-5]$/.test(row.owner_confidence_1_5)) throw new Error(`Row ${index + 1}: owner confidence must be 1..5.`);
    if (row.missing_fields !== "NONE" && !row.missing_fields.split(";").every((field) => columns.includes(field))) throw new Error(`Row ${index + 1}: missing_fields contains an unknown field.`);
    if (forbidden.test(row.primary_problem_summary_no_pii) || forbidden.test(row.correction_reason)) throw new Error(`Row ${index + 1}: possible identifier/URL in free text.`);
  }
  process.stdout.write(`Daily Close r1 valid: ${lines.length - 1} data row(s).\n`);
};

main().catch((error) => { console.error(error instanceof Error ? error.message : "Daily Close validation failed."); process.exit(1); });
