import { BulkIntakeStateSchema, type BulkIntakeState } from "../types/bulk-intake";

export const CURRENT_SCHEMA_VERSION = 1;

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, Migration> = {};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function migrateBulkIntake(data: unknown): Record<string, unknown> {
  if (!isPlainObject(data)) {
    throw new Error("BulkIntake migration input is not a plain object");
  }

  if (typeof data.schemaVersion !== "number") {
    data.schemaVersion = 1;
  }

  let version = data.schemaVersion as number;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `BulkIntake has schemaVersion ${version}, but app only supports up to ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    const fn = migrations[version];
    if (!fn) throw new Error(`Missing migration from v${version}`);
    fn(data);
    version = data.schemaVersion as number;
  }

  return data;
}

export function parseExternalBulkIntake(data: unknown): BulkIntakeState {
  return BulkIntakeStateSchema.parse(migrateBulkIntake(data));
}
