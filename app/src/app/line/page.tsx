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
    <ScreenShell variant="center">
      <AppCard labelledBy="line-entry-title" className="bqa-app-card--stacked">
        <PageHeader
          id="line-entry-title"
          title="เชื่อม LINE เพื่อแจ้งเตือนคิว"
          subtitle="LINE entry"
          imageSrc="/assets/generated-v1/line-notification-cutout.png"
          largeImage
        />
        <LineEntryClient liffId={process.env.NEXT_PUBLIC_LINE_LIFF_ID} targetPath={targetPath} />
      </AppCard>
    </ScreenShell>
  );
};

export default LineEntryPage;
