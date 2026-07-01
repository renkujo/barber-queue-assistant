type LinePushTextMessage = {
  type: "text";
  text: string;
};

type LinePushRequestBody = {
  to: string;
  messages: LinePushTextMessage[];
};

export interface ILinePushClient {
  pushTextMessage(to: string, text: string): Promise<void>;
}

export const getLineAccessToken = () => process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || null;

export class LineClient implements ILinePushClient {
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async pushTextMessage(to: string, text: string) {
    const body: LinePushRequestBody = {
      to,
      messages: [{ type: "text", text }],
    };

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`LINE push failed: ${response.status}`);
    }
  }
}

export const createLineClient = () => {
  const accessToken = getLineAccessToken();

  if (!accessToken) {
    return null;
  }

  return new LineClient(accessToken);
};
