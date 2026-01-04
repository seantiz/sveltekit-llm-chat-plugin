type WellKnownHealth = "connecting" | "connected" | "closed" | "error";

// A layer for Websocket and SSE connections - only two-way WS needs a send() method
interface StreamConnection {
  connect(payload?: string): Promise<void>;
  send?(data: string): void;
  onMessage(handler: (data: string) => void): void;
  close(): void;
  getHealth(): WellKnownHealth;
}

type EatTheIterables<T> = (raw: string) => T;

// Global entry point to composing a new stream session
export function newConnection(
  type: "websocket" | "sse",
  url: string,
): StreamConnection {
  return type === "websocket"
    ? new WebSocketConnection(url)
    : new SSEConnection(url);
}

export class WebSocketConnection implements StreamConnection {
  private ws: WebSocket | null = null;
  private retriesDone = 0;
  private shouldRetry = true;
  private messageHandler: (data: string) => void = () => {};
  private health: WellKnownHealth = "closed";

  constructor(
    private url: string = "",
    private config = { maxRetries: 3, backoffInMs: 1000 },
  ) {}

  getHealth(): WellKnownHealth {
    if (this.ws) {
      switch (this.ws.readyState) {
        case WebSocket.CONNECTING:
          return "connecting";
        case WebSocket.OPEN:
          return "connected";
        case WebSocket.CLOSED:
          return "closed";
        default:
          return "error";
      }
    } else {
      return "closed";
    }
  }

  async connect(payload?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket state -> OPEN");
      this.retriesDone = 0;
    };

    this.ws.onmessage = (event) => {
      this.messageHandler(event.data);
    };

    this.ws.onerror = (error) => {
      console.log("Websocket error:", error);
    };

    this.ws.onclose = () => {
      // Retry first before giving up
      if (this.shouldRetry && this.retriesDone < this.config.maxRetries) {
        const backoffDelay = this.retriesDone * this.config.backoffInMs;
        setTimeout(() => {
          this.retriesDone++;
          this.connect();
        }, backoffDelay);
      } else {
        this.ws = null;
        console.log("Websocket closed. Max re-connect limit reached.");
      }
    };
  }

  send(data: string): void {
    this.health = this.getHealth();
    if (this.ws && this.health === "connected") {
      this.ws.send(data);
    } else {
      throw new Error("Websocket not connected");
    }
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  // Wrapper method around native WS.close()
  close(): void {
    if (this.ws) {
      this.shouldRetry = false;
      this.ws.close();
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws = null;
    } else {
      console.log(
        "Please get in touch if you see this error: Tried to close when no Websocket was open!",
      );
    }
  }
}

/* New SSE connection calls send before connect to set payload
and does its own fetch
 */
class SSEConnection implements StreamConnection {
  private abortController: AbortController | null = null;
  private messageHandler: (data: string) => void = () => {};
  private retriesDone = 0;
  private shouldRetry = true;
  private health: WellKnownHealth = "closed";

  constructor(
    private url: string = "",
    private config = { maxBackoff: 30000, backoff: 1000 },
  ) {}

  getHealth(): WellKnownHealth {
    return this.health;
  }

  async connect(payload?: string): Promise<void> {
    if (!payload) {
      this.health = "error";
      throw new Error("Please provide a payload for your SSE connection.");
    }

    this.retriesDone = 0;
    this.health = "connecting";

    this.abortController = new AbortController();

    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      signal: this.abortController.signal,
    });
    if (!response.ok || !response.body) {
      this.health = "error";
      throw new Error(
        `SSE connection failed with bad response: ${response.status}`,
      );
    }

    this.health = "connected";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      this.messageHandler(chunk);
    }

    this.health = "closed";

    if (this.shouldRetry) this.retry(payload);
  }

  private retry(payload: string): void {
    this.retriesDone++;
    const backoffDelay = Math.min(
      this.retriesDone * this.config.backoff,
      this.config.maxBackoff,
    );

    setTimeout(() => {
      this.connect(payload);
    }, backoffDelay);
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  close(): void {
    this.shouldRetry = false;
    this.health = "closed";
    this.abortController?.abort();
    this.abortController = null;
  }
}

// Transformer chain will jailbreak our backend into handling the major LLM-provider responses
export function eatWith<T>(getter: (data: any) => T): EatTheIterables<T> {
  return (raw: string) => {
    const response = JSON.parse(raw);
    return getter(response);
  };
}

// OpenAI SSE connection config
export const openaiConnection = {
  url: "https://api.openai.com/v1/chat/completions",
  headers: (apiKey: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  transformer: eatWith((data) => data.choices?.[0]?.delta?.content || ""),
  buildPayload: (
    messages: Array<{ role: string; content: string }>,
    model = "gpt-4o",
  ) => ({
    model,
    messages,
    stream: true,
  }),
};

// Anthropic SSE connection config
export const anthropicConnection = {
  url: "https://api.anthropic.com/v1/messages",
  headers: (apiKey: string) => ({
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  }),
  transformer: eatWith((data) => data.delta?.text || ""),
  buildPayload: (
    messages: Array<{ role: string; content: string }>,
    model = "claude-sonnet-4-5",
  ) => ({
    model,
    messages,
    max_tokens: 1024,
    stream: true,
  }),
};
