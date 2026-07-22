import { prisma } from "@/lib/prisma";

const pilotIdPattern = /^[a-z0-9][a-z0-9-]{0,47}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type PilotMeasurementConfig = {
  enabled: true;
  cohortId: string;
  releaseSegment: string;
  evidenceDeleteAfter: Date;
};

export type PilotMeasurementState =
  | { enabled: false; status: "disabled" }
  | { enabled: true; status: "configured"; config: PilotMeasurementConfig }
  | { enabled: true; status: "misconfigured"; reason: string };

const parseEvidenceDeleteAfter = (value: string) => {
  if (!datePattern.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const calendarProbe = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarProbe.getUTCFullYear() !== year
    || calendarProbe.getUTCMonth() !== month - 1
    || calendarProbe.getUTCDate() !== day
  ) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getPilotMeasurementConfig = (): PilotMeasurementState => {
  if (process.env.PILOT_MEASUREMENT_ENABLED !== "true") {
    return { enabled: false, status: "disabled" };
  }

  const cohortId = process.env.PILOT_COHORT_ID?.trim() ?? "";
  const releaseSegment = process.env.PILOT_RELEASE_SEGMENT?.trim() ?? "";
  const deleteAfterValue = process.env.PILOT_EVIDENCE_DELETE_AFTER?.trim() ?? "";
  const evidenceDeleteAfter = parseEvidenceDeleteAfter(deleteAfterValue);

  if (!pilotIdPattern.test(cohortId)) {
    return { enabled: true, status: "misconfigured", reason: "invalid-cohort" };
  }

  if (!pilotIdPattern.test(releaseSegment)) {
    return { enabled: true, status: "misconfigured", reason: "invalid-release-segment" };
  }

  if (!evidenceDeleteAfter || evidenceDeleteAfter <= new Date()) {
    return { enabled: true, status: "misconfigured", reason: "invalid-evidence-expiry" };
  }

  return {
    enabled: true,
    status: "configured",
    config: {
      enabled: true,
      cohortId,
      releaseSegment,
      evidenceDeleteAfter,
    },
  };
};

export const requirePilotMeasurementConfig = async (): Promise<PilotMeasurementConfig | null> => {
  const state = getPilotMeasurementConfig();

  if (!state.enabled) {
    return null;
  }

  if (state.status !== "configured") {
    throw new Error("Pilot measurement is misconfigured.");
  }

  const cohort = await prisma.pilotCohort.findUnique({ where: { id: state.config.cohortId } });

  if (!cohort || cohort.evidenceExpiresAt.getTime() !== state.config.evidenceDeleteAfter.getTime()) {
    throw new Error("Pilot cohort is missing or its expiry does not match configuration.");
  }

  if (cohort.evidenceExpiresAt <= new Date()) {
    throw new Error("Pilot cohort is expired.");
  }

  return state.config;
};

export const getPilotMeasurementHealth = async () => {
  const state = getPilotMeasurementConfig();

  if (!state.enabled) {
    return { status: "disabled" as const };
  }

  if (state.status !== "configured") {
    return { status: "misconfigured" as const, reason: state.reason };
  }

  const cohort = await prisma.pilotCohort.findUnique({ where: { id: state.config.cohortId } });

  if (!cohort || cohort.evidenceExpiresAt.getTime() !== state.config.evidenceDeleteAfter.getTime()) {
    return { status: "misconfigured" as const, reason: "cohort-mismatch" };
  }

  return { status: "configured" as const, cohortId: cohort.id, releaseSegment: state.config.releaseSegment };
};
