import pg from "pg";

const roleByCredential = Object.freeze({
  PILOT_REPORT_DATABASE_URL: "bqa_pilot_reporter",
  PILOT_OPERATOR_DATABASE_URL: "bqa_pilot_operator",
  PILOT_RETENTION_DATABASE_URL: "bqa_pilot_retention",
});
const maxOutputBytes = 64 * 1024;

export const getArgs = () => {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index];
    if (!key?.startsWith("--")) continue;
    const next = process.argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(key.slice(2), next);
      index += 1;
    } else {
      args.set(key.slice(2), true);
    }
  }
  return args;
};

const parseConnectionIdentity = (name, value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) throw new Error(`${name} must use PostgreSQL.`);
  const role = decodeURIComponent(url.username);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!role || !database || database.includes("/")) throw new Error(`${name} must include one explicit role and database.`);
  return { url, role, database };
};

export const requirePilotDatabaseUrl = (name, args = getArgs()) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in the process environment; app .env fallback is forbidden.`);
  if (process.env.DATABASE_URL && value === process.env.DATABASE_URL) throw new Error(`${name} must not equal DATABASE_URL.`);
  const identity = parseConnectionIdentity(name, value);
  const expectedRole = roleByCredential[name];
  if (!expectedRole || identity.role !== expectedRole) throw new Error(`${name} must identify exactly ${expectedRole}.`);

  const networkScope = process.env.PILOT_NETWORK_SCOPE;
  const sslMode = identity.url.searchParams.get("sslmode");
  if (networkScope !== "private" && sslMode !== "verify-full") {
    throw new Error("Set PILOT_NETWORK_SCOPE=private, or use sslmode=verify-full outside the private network.");
  }
  const databaseEnvironment = process.env.PILOT_DATABASE_ENV;
  if (!new Set(["development", "staging", "production"]).has(databaseEnvironment)) {
    throw new Error("PILOT_DATABASE_ENV must explicitly be development, staging, or production.");
  }
  const expectedDatabase = process.env.PILOT_EXPECTED_DATABASE?.trim();
  const expectedHost = process.env.PILOT_EXPECTED_HOST?.trim().toLowerCase();
  if (!expectedDatabase || !expectedHost) {
    throw new Error("PILOT_EXPECTED_DATABASE and PILOT_EXPECTED_HOST are required independent identity checks.");
  }
  if (identity.database !== expectedDatabase || identity.url.hostname.toLowerCase() !== expectedHost) {
    throw new Error("Pilot credential targets an unexpected database or host.");
  }
  if (databaseEnvironment === "production" && args.get("confirm-production") !== true) {
    throw new Error("Production execution requires --confirm-production.");
  }
  return { value, expectedDatabase, expectedHost, ...identity };
};

export const writeBoundedJson = (value) => {
  const output = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(output) > maxOutputBytes) throw new Error("Refusing output larger than 64 KiB.");
  process.stdout.write(output);
};

export const withPilotClient = async (name, callback, args = getArgs()) => {
  const connection = requirePilotDatabaseUrl(name, args);
  const client = new pg.Client({
    connectionString: connection.value,
    ssl: connection.url.searchParams.get("sslmode") === "verify-full" ? { rejectUnauthorized: true } : undefined,
  });
  await client.connect();
  try {
    const identity = await client.query("select current_database() as database, current_user as role");
    const actual = identity.rows[0];
    if (actual?.database !== connection.expectedDatabase || actual?.role !== connection.role) {
      throw new Error("Connected database identity does not match the parsed credential identity.");
    }
    return await callback(client);
  } finally {
    await client.end();
  }
};

export const normalizeQueueCodeSuffix = (value) => {
  const normalized = String(value ?? "").trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^Q[A-Z0-9]{6}$/.test(normalized)) throw new Error("A valid queue code is required.");
  return normalized.slice(1);
};

export const requireExecute = (args) => args.get("execute") === true;

export const requireOperatorId = () => {
  const value = process.env.PILOT_OPERATOR_ID?.trim();
  if (!value || !/^[A-Za-z0-9._@-]{2,64}$/.test(value)) throw new Error("PILOT_OPERATOR_ID is required and must be a bounded audit identity.");
  return value;
};
