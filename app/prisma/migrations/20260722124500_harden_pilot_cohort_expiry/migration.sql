CREATE OR REPLACE FUNCTION prevent_pilot_cohort_expiry_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."evidenceExpiresAt" IS DISTINCT FROM OLD."evidenceExpiresAt" THEN
    RAISE EXCEPTION 'Pilot cohort evidence expiry is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "PilotCohort_immutable_expiry"
BEFORE UPDATE ON "PilotCohort"
FOR EACH ROW
EXECUTE FUNCTION prevent_pilot_cohort_expiry_change();
