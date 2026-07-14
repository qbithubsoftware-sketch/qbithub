"use client";

/**
 * AIPurchaseImportCenterPage — Enterprise AI Product Import Center.
 *
 * Visible ONLY to super_administrator + administrator (enforced by RBAC
 * in SCREEN_PERMISSIONS + AuthGuard).
 *
 * Features:
 *   1. Upload purchase document (invoice/warranty card/registration form)
 *   2. AI extraction review (editable form with extracted fields)
 *   3. Register purchase (creates CustomerAccount + PurchaseRecord + links product)
 *   4. View all registered purchases (table with customer/product/warranty)
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Purchase {
  id: string;
  purchaseId: string;
  customerName: string;
  mobileNumber: string;
  productName: string;
  modelNumber: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyEndDate: string | null;
  totalAmount: number | null;
  status: string;
  productMatched: boolean;
}

interface ExtractedData {
  customerName?: string | null;
  companyName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  invoiceNumber?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  productName?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  warrantyPeriod?: string | null;
  dealerName?: string | null;
  paymentStatus?: string | null;
  confidence?: number | null;
}

const DOCUMENT_TYPES = [
  { value: "invoice", label: "Invoice PDF" },
  { value: "gst_invoice", label: "GST Invoice" },
  { value: "tax_invoice", label: "Tax Invoice" },
  { value: "retail_bill", label: "Retail Bill" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "delivery_challan", label: "Delivery Challan" },
  { value: "warranty_card", label: "Warranty Card" },
  { value: "registration_form", label: "Product Registration Form" },
];

export function AIPurchaseImportCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("invoice");

  // Extraction review dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchases?limit=50", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPurchases(data.purchases?.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        purchaseId: p.purchaseId as string,
        customerName: (p.customer as { name: string })?.name ?? "—",
        mobileNumber: (p.customer as { mobileNumber: string })?.mobileNumber ?? "—",
        productName: p.productName as string,
        modelNumber: p.modelNumber as string,
        serialNumber: p.serialNumber as string | null,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate as string).toLocaleDateString("en-IN") : null,
        warrantyEndDate: p.warrantyEndDate ? new Date(p.warrantyEndDate as string).toLocaleDateString("en-IN") : null,
        totalAmount: p.totalAmount as number | null,
        status: p.installationStatus as string,
        productMatched: !!p.productId,
      })) ?? []);
    } catch {
      toast({ title: "Failed to load purchases", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchPurchases(); }, [fetchPurchases]);

  async function handleUpload() {
    if (!selectedFile) {
      toast({ title: "Please select a file first", variant: "destructive" });
      return;
    }
    setUploading(true);
    setExtractionError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);

      const res = await fetch("/api/admin/purchases/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json();

      setInvoiceId(data.invoiceId);

      if (data.extracted) {
        setExtracted(data.extracted);
        setReviewOpen(true);
        toast({ title: "AI extraction complete", description: `Confidence: ${data.extracted.confidence ?? "N/A"}%` });
      } else if (data.manualEntryRequired) {
        setExtracted({});
        setExtractionError(data.error ?? "AI extraction not configured. Please enter data manually.");
        setReviewOpen(true);
        toast({ title: "Manual entry required", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleRegister() {
    if (!extracted.mobileNumber || !extracted.modelNumber) {
      toast({ title: "Mobile Number and Model Number are required", variant: "destructive" });
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch("/api/admin/purchases/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: extracted, invoiceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Registration failed");
      }
      const data = await res.json();
      toast({
        title: "Purchase registered!",
        description: `Purchase ID: ${data.purchaseId?.slice(0, 20)}... | Customer ${data.customerCreated ? "created" : "updated"} | Product ${data.productMatched ? "matched" : "not found"}`,
      });
      setReviewOpen(false);
      setSelectedFile(null);
      setExtracted({});
      void fetchPurchases();
    } catch (e) {
      toast({ title: "Registration failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "AI Purchase Import", icon: "auto_awesome" }}
      navItems={ADMIN_NAV}
      activeScreen="ai-purchase-center"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchPurchases() }}
      topBar={{ searchPlaceholder: "Search purchases…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="auto_awesome" className="text-[28px] text-qbit-primary" />
              AI Product Import Center
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Upload customer purchase documents. AI extracts customer + product info, matches to Product Library, and auto-registers the purchase.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Purchases" value={purchases.length.toString()} icon="receipt_long" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Products Matched" value={purchases.filter((p) => p.productMatched).length.toString()} icon="link" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Pending Match" value={purchases.filter((p) => !p.productMatched).length.toString()} icon="pending" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="Installations" value={purchases.filter((p) => p.status === "completed").length.toString()} icon="build_circle" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
        </div>

        {/* Upload section */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-qbit-on-surface">
            <Icon name="upload_file" className="text-[20px] text-qbit-primary" />
            Upload Purchase Document
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Document File (PDF, PNG, JPG)</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="flex-1 rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-qbit-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-qbit-on-primary"
                />
                <QbitButton
                  variant="primary"
                  icon={uploading ? "progress_activity" : "cloud_upload"}
                  disabled={!selectedFile || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "Processing…" : "Upload & Extract"}
                </QbitButton>
              </div>
              {selectedFile && (
                <p className="mt-1 text-xs text-qbit-on-surface-variant">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </SurfaceCard>

        {/* Purchases table */}
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-qbit-outline-variant/50 px-6 py-4">
            <h3 className="text-base font-bold text-qbit-on-surface">Registered Purchases</h3>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <Icon name="progress_activity" className="mx-auto animate-spin text-[28px] text-qbit-primary" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Icon name="receipt_long" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
              <p className="mt-3 text-sm font-medium text-qbit-on-surface">No purchases registered yet.</p>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Upload a purchase document above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Warranty End</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.purchaseId}</TableCell>
                      <TableCell className="font-medium">{p.customerName}</TableCell>
                      <TableCell className="text-xs">{p.mobileNumber}</TableCell>
                      <TableCell className="text-sm">{p.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{p.modelNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{p.serialNumber ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.purchaseDate ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.warrantyEndDate ?? "—"}</TableCell>
                      <TableCell>
                        {p.productMatched ? (
                          <StatusBadge variant="success" dot>Linked</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning" dot>Pending</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        <TagBadge variant="neutral">{p.status}</TagBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* ===== Extraction Review Dialog ===== */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="auto_awesome" className="text-[24px] text-qbit-primary" />
              Review Extracted Data
            </DialogTitle>
            <DialogDescription>
              Review the AI-extracted fields below. Edit any incorrect values before registering the purchase.
              {extracted.confidence && (
                <span className="ml-2 rounded-full bg-qbit-primary/10 px-2 py-0.5 text-xs font-bold text-qbit-primary">
                  Confidence: {extracted.confidence}%
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {extractionError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-qbit-warning/30 bg-qbit-warning/5 px-3 py-2.5 text-xs text-qbit-on-surface-variant">
              <Icon name="info" className="text-[16px] text-qbit-warning" />
              {extractionError}
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* Customer section */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-qbit-primary">Customer Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Customer Name" value={extracted.customerName} onChange={(v) => setExtracted({ ...extracted, customerName: v })} />
                <FieldInput label="Company Name" value={extracted.companyName} onChange={(v) => setExtracted({ ...extracted, companyName: v })} />
                <FieldInput label="Mobile Number *" value={extracted.mobileNumber} onChange={(v) => setExtracted({ ...extracted, mobileNumber: v })} />
                <FieldInput label="Email" value={extracted.email} onChange={(v) => setExtracted({ ...extracted, email: v })} />
                <FieldInput label="GST Number" value={extracted.gstNumber} onChange={(v) => setExtracted({ ...extracted, gstNumber: v })} />
                <FieldInput label="City" value={extracted.city} onChange={(v) => setExtracted({ ...extracted, city: v })} />
              </div>
            </div>

            {/* Product section */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-qbit-primary">Product Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Product Name" value={extracted.productName} onChange={(v) => setExtracted({ ...extracted, productName: v })} />
                <FieldInput label="Brand" value={extracted.brand} onChange={(v) => setExtracted({ ...extracted, brand: v })} />
                <FieldInput label="Model Number *" value={extracted.modelNumber} onChange={(v) => setExtracted({ ...extracted, modelNumber: v })} />
                <FieldInput label="Serial Number" value={extracted.serialNumber} onChange={(v) => setExtracted({ ...extracted, serialNumber: v })} />
              </div>
            </div>

            {/* Invoice section */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-qbit-primary">Invoice & Warranty</h4>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Invoice Number" value={extracted.invoiceNumber} onChange={(v) => setExtracted({ ...extracted, invoiceNumber: v })} />
                <FieldInput label="Warranty Period" value={extracted.warrantyPeriod} onChange={(v) => setExtracted({ ...extracted, warrantyPeriod: v })} />
                <FieldInput label="Dealer Name" value={extracted.dealerName} onChange={(v) => setExtracted({ ...extracted, dealerName: v })} />
                <FieldInput label="Total Amount" value={extracted.totalAmount?.toString()} onChange={(v) => setExtracted({ ...extracted, totalAmount: v ? parseFloat(v) : null })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</QbitButton>
            <QbitButton
              variant="primary"
              icon={registering ? "progress_activity" : "check_circle"}
              disabled={registering || !extracted.mobileNumber || !extracted.modelNumber}
              onClick={handleRegister}
            >
              {registering ? "Registering…" : "Register Purchase"}
            </QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FieldInput({ label, value, onChange }: { label: string; value: string | null | undefined; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-qbit-on-surface-variant">{label}</label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );
}
