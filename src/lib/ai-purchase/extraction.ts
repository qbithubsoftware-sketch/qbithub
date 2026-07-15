/**
 * AI Purchase Extraction Service
 *
 * Extracts structured data from uploaded purchase documents (invoices,
 * warranty cards, registration forms) using AI document parsing.
 *
 * Architecture:
 *   - DocumentExtractionProvider is the abstract interface.
 *   - PlaceholderExtractionProvider throws NOT_IMPLEMENTED (no mock data).
 *   - When the real OCR/AI service is connected, implement it as a new
 *     provider and register it in the registry.
 *
 * Future integration: Google Document AI, AWS Textract, Azure Form
 * Recognizer, or a custom LLM-based parser.
 */

/** Extracted purchase fields from a document. */
export interface ExtractedPurchaseData {
  // Customer information
  customerName?: string | null;
  companyName?: string | null;
  mobileNumber?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  // Invoice details
  invoiceNumber?: string | null;
  invoiceDate?: Date | null;
  purchaseDate?: Date | null;
  // Dealer
  dealerName?: string | null;
  dealerId?: string | null;
  // Address
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  // Product details
  productName?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  quantity?: number | null;
  // Pricing
  unitPrice?: number | null;
  gstAmount?: number | null;
  totalAmount?: number | null;
  paymentStatus?: string | null;
  // Warranty
  warrantyPeriod?: string | null;
  warrantyStartDate?: Date | null;
  warrantyEndDate?: Date | null;
  // Metadata
  documentType?: string | null;
  confidence?: number | null; // 0-100
  rawText?: string | null; // full OCR text (for audit)
}

/** Result of an extraction attempt. */
export interface ExtractionResult {
  success: boolean;
  data?: ExtractedPurchaseData;
  error?: string;
}

/** Abstract provider interface for document extraction. */
export interface DocumentExtractionProvider {
  readonly name: string;
  /**
   * Extract structured data from a document file.
   * @param fileBuffer The file content (PDF, PNG, JPG, etc.)
   * @param mimeType The MIME type of the file.
   * @param fileName The original file name.
   */
  extract(fileBuffer: Buffer, mimeType: string, fileName: string): Promise<ExtractionResult>;
}

/** Placeholder provider — throws NOT_IMPLEMENTED. No mock data. */
export class PlaceholderExtractionProvider implements DocumentExtractionProvider {
  readonly name = "placeholder";

  async extract(
    _fileBuffer: Buffer,
    _mimeType: string,
    _fileName: string,
  ): Promise<ExtractionResult> {
    return {
      success: false,
      error:
        "AI document extraction is not configured. Set the EXTRACTION_PROVIDER env var to a registered provider (e.g. 'google-doc-ai', 'aws-textract', 'azure-form-recognizer'). Until then, admins can manually enter purchase data via the Manual Entry form.",
    };
  }
}

/** Provider registry — picks provider from EXTRACTION_PROVIDER env var. */
class ExtractionRegistry {
  private factories = new Map<string, () => DocumentExtractionProvider>();
  private cached: DocumentExtractionProvider | null = null;

  register(name: string, factory: () => DocumentExtractionProvider): void {
    this.factories.set(name, factory);
    this.cached = null;
  }

  get(): DocumentExtractionProvider {
    if (this.cached) return this.cached;
    const name = process.env.EXTRACTION_PROVIDER ?? "placeholder";
    const factory = this.factories.get(name);
    if (!factory) {
      console.warn(`[ai-extraction] Unknown provider "${name}" — using placeholder.`);
      this.cached = new PlaceholderExtractionProvider();
      return this.cached;
    }
    this.cached = factory();
    return this.cached;
  }

  getActiveProviderName(): string {
    return process.env.EXTRACTION_PROVIDER ?? "placeholder";
  }
}

export const extractionRegistry = new ExtractionRegistry();

// Register the placeholder as default.
extractionRegistry.register("placeholder", () => new PlaceholderExtractionProvider());

// Future providers:
// extractionRegistry.register("google-doc-ai", () => new GoogleDocAIProvider());
// extractionRegistry.register("aws-textract", () => new AwsTextractProvider());
// extractionRegistry.register("azure-form-recognizer", () => new AzureFormRecognizerProvider());

/**
 * Extract purchase data from an uploaded document.
 * Convenience wrapper around the registry.
 */
export async function extractPurchaseData(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractionResult> {
  const provider = extractionRegistry.get();
  return provider.extract(fileBuffer, mimeType, fileName);
}
