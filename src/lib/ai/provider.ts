/**
 * AI Provider abstraction layer.
 *
 * The application talks to AI providers through the `AIProvider` interface.
 * The default adapter uses the z-ai-web-dev-sdk (GLM model).  New
 * adapters (OpenAI, Azure OpenAI, Gemini, Claude, self-hosted) can be
 * added by implementing the `AIProvider` interface — no other code
 * changes required.
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";

// ---------- ZAI Adapter (default — uses z-ai-web-dev-sdk) ----------

/**
 * ZAIProvider — default AI provider using the z-ai-web-dev-sdk.
 *
 * The SDK must be used server-side only (it reads API keys from env).
 */
export class ZAIProvider implements AIProvider {
  name = "zai";

  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Dynamic import — the SDK is server-only.
    const ZAI = (await import("z-ai-web-dev-sdk")).default;

    // ZAI uses a static factory method (private constructor)
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: request.model ?? "glm-4",
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      stream: false,
    });

    const responseTimeMs = Date.now() - startTime;

    return {
      content: completion.choices?.[0]?.message?.content ?? "",
      model: completion.model ?? request.model ?? "glm-4",
      provider: this.name,
      tokensUsed: completion.usage?.total_tokens ?? 0,
      responseTimeMs,
    };
  }
}

// ---------- Mock Adapter (fallback for development without API key) ----------

/**
 * MockProvider — returns a structured response without calling any AI API.
 * Used when no API key is configured (development/preview mode).
 */
export class MockProvider implements AIProvider {
  name = "mock";

  async chat(request: AIRequest): Promise<AIResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    const query = lastUserMessage?.content ?? "";

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const content = generateMockResponse(query);

    return {
      content,
      model: "mock-llm",
      provider: this.name,
      tokensUsed: Math.floor(content.length / 4),
      responseTimeMs: 800,
    };
  }
}

/**
 * Returns the active AI provider based on environment configuration.
 * Falls back to MockProvider when no API key is set.
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env.ZAI_API_KEY;
  if (apiKey && apiKey.length > 0) {
    return new ZAIProvider();
  }
  return new MockProvider();
}

// ---------- Mock response generator ----------

function generateMockResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("install") || q.includes("setup")) {
    return `## Installation Guide\n\nTo install your QBIT product, follow these steps:\n\n1. **Unbox & Inventory** — Verify all components are present (5 min)\n2. **Power Connection** — Connect the DC power adapter (5 min)\n3. **Peripheral Wiring** — Connect printer, scanner, cash drawer (8 min)\n4. **Driver Configuration** — Install drivers from the Download Center (5 min)\n5. **Test Print** — Run a test print to verify (2 min)\n\n**Estimated total time: 25 minutes**\n\nFor detailed instructions, see the Installation Guide linked in the related assets below.`;
  }

  if (q.includes("driver") || q.includes("download")) {
    return `## Latest Drivers\n\nThe latest drivers for QBIT hardware are available in the **Driver Download Center**:\n\n| Driver | Version | Size |\n|---|---|---|\n| Universal Thermal Printer Driver | v2.4.1 | 12.4 MB |\n| Barcode Scanner SDK | v1.9 | 128 MB |\n| POS Terminal Firmware | v4.1.2 | 45.8 MB |\n\nAll drivers are verified and digitally signed. Download from the Related Assets below.`;
  }

  if (q.includes("printer") && (q.includes("not") || q.includes("problem") || q.includes("error"))) {
    return `## Thermal Printer Not Printing\n\n**Common causes:**\n- USB cable disconnected\n- Driver not installed\n- Paper roll empty\n- Print head overheated\n\n**Resolution steps:**\n1. Verify the USB cable is firmly connected at both ends\n2. Install the Universal Thermal Printer Driver v2.4.1\n3. Replace the paper roll with 80mm thermal paper\n4. If the print head is overheated, allow 5 minutes cooldown\n\nSee the troubleshooting guide in the Related Assets for more details.`;
  }

  if (q.includes("firmware")) {
    return `## Firmware Updates\n\n**Current stable firmware versions:**\n- POS-2000/3000: **v4.1.2** (CVE-2023-5421 security patch)\n- HUB-X Series: **v2.4** (stable build)\n- Nexus X1: **v4.2** (latest)\n\n⚠️ **Warning:** Never power off the terminal during a firmware update. This can brick the device.\n\nDownload firmware from the Driver Download Center.`;
  }

  if (q.includes("scanner") && (q.includes("not") || q.includes("problem"))) {
    return `## Barcode Scanner Not Scanning\n\n**Symptoms:**\n- Scanner beeps but no data appears\n- Laser not visible\n- Intermittent scanning\n\n**Resolution:**\n1. Factory reset by scanning the 'Factory Default' barcode\n2. Verify communication mode (HID vs COM)\n3. Test in the QBIT Diagnostic Utility\n4. Clean the scanner lens with a microfiber cloth\n\nThe scanner SDK and calibration guide are linked below.`;
  }

  if (q.includes("manual") || q.includes("pdf")) {
    return `## Product Manuals\n\nThe following manuals are available for your QBIT products:\n\n- **Quick Start Guide** — 4 pages, 1.2 MB\n- **Installation Guide** — 24 pages, 3.8 MB\n- **User Manual** — 86 pages, 5.8 MB\n- **Warranty Card** — 2 pages, 0.8 MB\n- **Datasheet** — 8 pages, 2.4 MB\n\nAll manuals are PDF and can be previewed in the browser or downloaded.`;
  }

  return `I found relevant information about "${query}" in the QBIT Hub knowledge base. Here's what I found:\n\nThe QBIT Hub contains comprehensive documentation for all enterprise hardware including POS terminals, thermal printers, barcode scanners, and kiosks.\n\n**Related resources are listed below** — including installation guides, drivers, manuals, and troubleshooting articles specific to your query.\n\nIs there anything specific you'd like me to help you with?`;
}
