import { AppCard, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { LineEntryClient } from "./line-entry-client";

type LineEntryTarget = "book" | "walk-in" | "queue-status";

type LineEntryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getSearchParamValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const normalizeTarget = (target?: string | null): LineEntryTarget | null => {
  if (target === "book") {
    return "book";
  }

  if (target === "walk-in") {
    return "walk-in";
  }

  if (target === "queue-status" || target === "status" || target === "check-queue") {
    return "queue-status";
  }

  return null;
};

const getTargetFromLiffState = (state?: string) => {
  if (!state) {
    return null;
  }

  const decodedState = decodeURIComponent(state);

  if (decodedState.includes("#queue-status")) {
    return "queue-status" satisfies LineEntryTarget;
  }

  const queryString = decodedState.includes("?") ? decodedState.slice(decodedState.indexOf("?") + 1) : decodedState;
  const params = new URLSearchParams(queryString);

  return normalizeTarget(params.get("target"));
};

const getTargetPath = (target: LineEntryTarget) => {
  if (target === "book") {
    return "/book" as const;
  }

  if (target === "queue-status") {
    return "/#queue-status" as const;
  }

  return "/walk-in" as const;
};

const getLineEntryTarget = (params: Awaited<LineEntryPageProps["searchParams"]>) =>
  normalizeTarget(getSearchParamValue(params.target)) ?? getTargetFromLiffState(getSearchParamValue(params["liff.state"])) ?? "walk-in";

const LineEntryPage = async ({ searchParams }: LineEntryPageProps) => {
  const params = await searchParams;
  const targetPath = getTargetPath(getLineEntryTarget(params));

  return (
    <ScreenShell className="bqa-book-shell bqa-line-shell">
      <AppCard labelledBy="line-entry-title" className="bqa-book-card bqa-line-card">
        <PageHeader
          id="line-entry-title"
          title="เชื่อม LINE เพื่อรับแจ้งเตือน"
          subtitle="แจ้งเตือนคิว"
        />
        <LineEntryClient liffId={process.env.NEXT_PUBLIC_LINE_LIFF_ID} targetPath={targetPath} />
      </AppCard>
    </ScreenShell>
  );
};

export default LineEntryPage;
