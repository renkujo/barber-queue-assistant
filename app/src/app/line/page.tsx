import { AppCard, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { LineEntryClient } from "./line-entry-client";

type LineEntryTarget = "book" | "walk-in" | "queue-status" | "owner";

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

  if (target === "owner" || target === "owner-line") {
    return "owner";
  }

  return null;
};

const getStateSearchParams = (state?: string) => {
  if (!state) {
    return new URLSearchParams();
  }

  const decodedState = decodeURIComponent(state);

  if (decodedState.includes("#queue-status")) {
    return new URLSearchParams("target=queue-status");
  }

  const queryString = decodedState.includes("?") ? decodedState.slice(decodedState.indexOf("?") + 1) : decodedState;

  return new URLSearchParams(queryString);
};

const getTargetPath = (target: LineEntryTarget, token?: string) => {
  if (target === "book") {
    return "/book" as const;
  }

  if (target === "queue-status") {
    return "/#queue-status" as const;
  }

  if (target === "owner") {
    const query = new URLSearchParams();

    if (token) {
      query.set("token", token);
    }

    return `/line/owner?${query.toString()}` as const;
  }

  return "/walk-in" as const;
};

const getLineEntryTarget = (params: Awaited<LineEntryPageProps["searchParams"]>) => {
  const liffStateParams = getStateSearchParams(getSearchParamValue(params["liff.state"]));
  const target = normalizeTarget(getSearchParamValue(params.target)) ?? normalizeTarget(liffStateParams.get("target")) ?? "walk-in";
  const token = getSearchParamValue(params.token) ?? liffStateParams.get("token") ?? undefined;

  return { target, token };
};

const LineEntryPage = async ({ searchParams }: LineEntryPageProps) => {
  const params = await searchParams;
  const { target, token } = getLineEntryTarget(params);
  const targetPath = getTargetPath(target, token);

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
