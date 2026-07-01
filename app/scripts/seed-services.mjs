import { readFile } from "node:fs/promises";
import pg from "pg";

const parseEnvFile = async () => {
  const env = {};
  const content = await readFile(new URL("../.env", import.meta.url), "utf8").catch(() => "");

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index);
    const value = line.slice(index + 1).replace(/^"|"$/g, "");
    env[key] = value;
  }

  return env;
};

const services = [
  { id: "haircut", name: "ตัดผมชาย", durationMinutes: 30, priceCents: 25000, sortOrder: 0 },
  { id: "shave", name: "โกนหนวด", durationMinutes: 20, priceCents: 15000, sortOrder: 1 },
  { id: "wash-cut", name: "ตัด + สระ", durationMinutes: 45, priceCents: 35000, sortOrder: 2 },
];

const main = async () => {
  const env = await parseEnvFile();
  const connectionString = process.env.DATABASE_URL ?? env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed services.");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");

    for (const service of services) {
      await client.query(
        `insert into "Service" ("id", "name", "durationMinutes", "priceCents", "sortOrder", "isActive", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, $5, true, now(), now())
         on conflict ("id") do update set
           "name" = excluded."name",
           "durationMinutes" = excluded."durationMinutes",
           "priceCents" = excluded."priceCents",
           "sortOrder" = excluded."sortOrder",
           "isActive" = true,
           "updatedAt" = now()`,
        [service.id, service.name, service.durationMinutes, service.priceCents, service.sortOrder],
      );
    }

    await client.query(
      `insert into "ShopSettings" ("id", "shopName", "openDays", "businessHours", "createdAt", "updatedAt")
       values ($1, $2, $3::jsonb, $4::jsonb, now(), now())
       on conflict ("id") do update set
         "shopName" = excluded."shopName",
         "openDays" = excluded."openDays",
         "businessHours" = excluded."businessHours",
         "updatedAt" = now()`,
      [
        "default-shop",
        "ร้านช่างหนึ่ง",
        JSON.stringify(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
        JSON.stringify({ open: "09:00", close: "19:00" }),
      ],
    );

    await client.query("commit");

    const result = await client.query('select "id", "name", "durationMinutes", "priceCents" from "Service" order by "sortOrder" asc');
    console.table(result.rows);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
