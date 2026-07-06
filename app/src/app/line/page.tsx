import { AppCard, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { LineEntryClient } from "./line-entry-client";

type LineEntryPageProps = {
  searchParams: Promise<{ target?: string }>;
};

const getTargetPath = (target?: string) => {
  if (target === "book") {
    return "/book" as const;
  }

  return "/walk-in" as const;
};

const LineEntryPage = async ({ searchParams }: LineEntryPageProps) => {
  const params = await searchParams;
  const targetPath = getTargetPath(params.target);

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
