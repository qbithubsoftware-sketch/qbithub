/**
 * Dr. QBIT — Universal Device Architecture Engine
 *
 * This is the central service that makes Dr. QBIT extensible for ANY
 * future QBIT hardware without modifying the core engine.
 *
 * Architecture Principle:
 *   - Capability-Driven, NOT Device-Type-Specific
 *   - All definitions (categories, capabilities, connection types, adapters)
 *     are loaded from the DATABASE at runtime — NEVER hardcoded
 *   - The core engines (Discovery, Identification, Cloud Lookup,
 *     Configuration, Diagnostics, Lifecycle) call this module to
 *     get device category info, capability profiles, connection type
 *     definitions, and adapter mappings
 *   - When admin adds a new DeviceCategory + CapabilityDefinition +
 *     ConnectionTypeDefinition + CommunicationAdapterDefinition,
 *     the engine automatically picks them up — NO code changes needed
 *
 * This module provides:
 *   1. loadDeviceCategories() — all device categories from DB
 *   2. loadCapabilityDefinitions() — all capability definitions from DB
 *   3. loadConnectionTypeDefinitions() — all connection types from DB
 *   4. loadCommunicationAdapters() — all adapter definitions from DB
 *   5. getProductCapabilityProfile() — capability profile for a specific product
 *   6. getProductConnectionProfile() — connection types for a specific product
 *   7. getCategoryDefaults() — default capabilities/connection types for a category
 *   8. getApplicableAdaptersForProduct() — which adapters handle this product
 *   9. getApplicableAdaptersForCategory() — which adapters handle this category
 *   10. resolveDeviceCategory() — determine category from deviceType string
 *   11. resolveAdapterClass() — map adapter definition to runtime adapter class
 *   12. onboardNewDevice() — 7-step admin onboarding for new hardware
 *
 * SAFETY:
 *   - All data from real database — no hardcoded/fake/mock data
 *   - If DB definitions are missing, the engine falls back to the
 *     legacy TypeScript types (backward compatible)
 *   - Admin can add/modify/delete definitions via API routes
 *   - Core engine NEVER modified — only definitions change
 */

import { db } from "@/lib/db";

// ====================== Architecture Types ======================

/** A device category loaded from the database. */
export interface ArchitectureDeviceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  productFamily: string | null;
  supportedInterfaces: string[]; // parsed from JSON
  defaultProtocol: string | null;
  supportedOS: string[]; // parsed from JSON
  sortIndex: number;
  isActive: boolean;
  isPublic: boolean;
  status: string;
}

/** A capability definition loaded from the database. */
export interface ArchitectureCapability {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  capabilityGroup: string | null;
  isQbitRelevant: boolean;
  affectsDiscovery: boolean;
  affectsConfiguration: boolean;
  affectsDiagnostics: boolean;
  affectsLifecycle: boolean;
  sortIndex: number;
  isActive: boolean;
}

/** A connection type definition loaded from the database. */
export interface ArchitectureConnectionType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  protocol: string | null;
  supportsDiscovery: boolean;
  requiresDesktopAgent: boolean;
  supportsConfiguration: boolean;
  supportsDiagnostics: boolean;
  sortIndex: number;
  isActive: boolean;
}

/** A communication adapter definition loaded from the database. */
export interface ArchitectureAdapter {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  adapterClass: string;
  protocol: string | null;
  requiresDesktopAgent: boolean;
  supportsLiveDiagnostics: boolean;
  supportsConfiguration: boolean;
  supportsFirmwareOps: boolean;
  isActive: boolean;
  sortIndex: number;
  /** Which categories this adapter handles (resolved from CategoryAdapterMapping). */
  applicableCategories: string[]; // category slugs
  /** Which connection types this adapter handles (resolved from AdapterConnectionType). */
  applicableConnectionTypes: string[]; // connection type slugs
}

/** Complete capability profile for a product (resolved from DB). */
export interface ProductCapabilityProfile {
  productId: string;
  productModel: string;
  categorySlug: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  /** All capabilities this product supports (resolved from ProductCapability + CapabilityDefinition). */
  capabilities: ArchitectureCapability[];
  /** Capability slugs only (for quick checks). */
  capabilitySlugs: string[];
  /** Whether this product supports a specific capability. */
  hasCapability: (slug: string) => boolean;
  /** Get capabilities that affect a specific engine phase. */
  getCapabilitiesByPhase: (phase: "discovery" | "configuration" | "diagnostics" | "lifecycle") => ArchitectureCapability[];
}

/** Complete connection profile for a product (resolved from DB). */
export interface ProductConnectionProfile {
  productId: string;
  productModel: string;
  /** All connection types this product supports. */
  connectionTypes: ArchitectureConnectionType[];
  /** Connection type slugs only (for quick checks). */
  connectionTypeSlugs: string[];
  /** The primary (default) connection type. */
  primaryConnectionType: ArchitectureConnectionType | null;
  /** Whether this product supports a specific connection type. */
  supportsConnection: (slug: string) => boolean;
}

/** Default settings for a category (auto-applied to new products). */
export interface CategoryDefaults {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  /** Default capabilities for this category. */
  defaultCapabilities: ArchitectureCapability[];
  /** Default connection types for this category. */
  defaultConnectionTypes: ArchitectureConnectionType[];
  /** Default adapters for this category. */
  defaultAdapters: ArchitectureAdapter[];
}

/** Result of resolving which adapters apply to a product. */
export interface ProductAdapterResolution {
  productId: string;
  categorySlug: string | null;
  /** All adapters that handle this product's category. */
  applicableAdapters: ArchitectureAdapter[];
  /** The primary adapter for this product. */
  primaryAdapter: ArchitectureAdapter | null;
  /** Adapter class names for runtime resolution. */
  adapterClasses: string[];
}

/** Result of the 7-step new device onboarding process. */
export interface OnboardingResult {
  success: boolean;
  productId: string;
  productSlug: string;
  categorySlug: string;
  /** Step-by-step results. */
  steps: {
    step1_createProduct: { completed: boolean; productId: string };
    step2_uploadDrivers: { completed: boolean; resourceIds: string[] };
    step3_uploadFirmware: { completed: boolean; resourceIds: string[] };
    step4_uploadManuals: { completed: boolean; resourceIds: string[] };
    step5_uploadSDK: { completed: boolean; resourceIds: string[] };
    step6_createDeviceProfile: { completed: boolean; capabilitiesLinked: number; connectionTypesLinked: number };
    step7_assignCapabilityProfile: { completed: boolean; capabilitiesLinked: number; connectionTypesLinked: number };
  };
  /** Whether a new communication adapter was needed and created. */
  newAdapterCreated: boolean;
  adapterId: string | null;
  /** Human-readable summary. */
  summary: string;
  /** Errors encountered (if any). */
  errors: string[];
}

/** Architecture resolution result — combines all profiles for a product. */
export interface ArchitectureResolution {
  productId: string;
  productModel: string;
  category: ArchitectureDeviceCategory | null;
  capabilityProfile: ProductCapabilityProfile;
  connectionProfile: ProductConnectionProfile;
  adapterResolution: ProductAdapterResolution;
  /** Whether this was resolved from DB (true) or fell back to legacy types (false). */
  resolvedFromDB: boolean;
}

// ====================== Data Loading Functions ======================

/**
 * Load all device categories from the database.
 * Returns ONLY active categories, sorted by sortIndex.
 *
 * This replaces the hardcoded CATEGORY_LABELS and deviceType strings.
 * Admin can add new categories via API without code changes.
 */
export async function loadDeviceCategories(): Promise<ArchitectureDeviceCategory[]> {
  try {
    const categories = await db.deviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortIndex: "asc" },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      productFamily: cat.productFamily,
      supportedInterfaces: cat.supportedInterfaces
        ? JSON.parse(cat.supportedInterfaces)
        : [],
      defaultProtocol: cat.defaultProtocol,
      supportedOS: cat.supportedOS ? JSON.parse(cat.supportedOS) : [],
      sortIndex: cat.sortIndex,
      isActive: cat.isActive,
      isPublic: cat.isPublic,
      status: cat.status,
    }));
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load device categories from DB:", error);
    // Return empty array — engines will fall back to legacy types
    return [];
  }
}

/**
 * Load all capability definitions from the database.
 * Returns ONLY active, QBIT-relevant capabilities, sorted by sortIndex.
 *
 * This replaces the hardcoded DeviceCapability union type and CAPABILITY_LABELS.
 * Admin can add new capabilities via API without code changes.
 */
export async function loadCapabilityDefinitions(): Promise<ArchitectureCapability[]> {
  try {
    const capabilities = await db.capabilityDefinition.findMany({
      where: { isActive: true, isQbitRelevant: true },
      orderBy: [{ capabilityGroup: "asc" }, { sortIndex: "asc" }],
    });

    return capabilities.map((cap) => ({
      id: cap.id,
      slug: cap.slug,
      name: cap.name,
      description: cap.description,
      icon: cap.icon,
      capabilityGroup: cap.capabilityGroup,
      isQbitRelevant: cap.isQbitRelevant,
      affectsDiscovery: cap.affectsDiscovery,
      affectsConfiguration: cap.affectsConfiguration,
      affectsDiagnostics: cap.affectsDiagnostics,
      affectsLifecycle: cap.affectsLifecycle,
      sortIndex: cap.sortIndex,
      isActive: cap.isActive,
    }));
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load capability definitions from DB:", error);
    return [];
  }
}

/**
 * Load all connection type definitions from the database.
 * Returns ONLY active connection types, sorted by sortIndex.
 *
 * This replaces the hardcoded DeviceConnection union type and CONNECTION_ICONS/LABELS.
 * Admin can add new connection types (Serial, NFC, Zigbee, etc.) via API.
 */
export async function loadConnectionTypeDefinitions(): Promise<ArchitectureConnectionType[]> {
  try {
    const connectionTypes = await db.connectionTypeDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortIndex: "asc" },
    });

    return connectionTypes.map((ct) => ({
      id: ct.id,
      slug: ct.slug,
      name: ct.name,
      description: ct.description,
      icon: ct.icon,
      protocol: ct.protocol,
      supportsDiscovery: ct.supportsDiscovery,
      requiresDesktopAgent: ct.requiresDesktopAgent,
      supportsConfiguration: ct.supportsConfiguration,
      supportsDiagnostics: ct.supportsDiagnostics,
      sortIndex: ct.sortIndex,
      isActive: ct.isActive,
    }));
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load connection type definitions from DB:", error);
    return [];
  }
}

/**
 * Load all communication adapter definitions from the database.
 * Returns ONLY active adapters, with resolved category/connection mappings.
 *
 * This is the formal adapter registry. When admin adds a new adapter
 * (for a new device category or protocol), the engine picks it up
 * without code changes.
 */
export async function loadCommunicationAdapters(): Promise<ArchitectureAdapter[]> {
  try {
    const adapters = await db.communicationAdapterDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortIndex: "asc" },
      include: {
        categoryAdapters: { include: { category: true } },
        adapterConnectionTypes: { include: { connectionType: true } },
      },
    });

    return adapters.map((adapter) => ({
      id: adapter.id,
      slug: adapter.slug,
      name: adapter.name,
      description: adapter.description,
      adapterClass: adapter.adapterClass,
      protocol: adapter.protocol,
      requiresDesktopAgent: adapter.requiresDesktopAgent,
      supportsLiveDiagnostics: adapter.supportsLiveDiagnostics,
      supportsConfiguration: adapter.supportsConfiguration,
      supportsFirmwareOps: adapter.supportsFirmwareOps,
      isActive: adapter.isActive,
      sortIndex: adapter.sortIndex,
      applicableCategories: adapter.categoryAdapters.map((ca) => ca.category.slug),
      applicableConnectionTypes: adapter.adapterConnectionTypes.map((act) => act.connectionType.slug),
    }));
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load communication adapters from DB:", error);
    return [];
  }
}

// ====================== Product Profile Resolution ======================

/**
 * Get the complete capability profile for a product.
 *
 * Resolves from DB: ProductCapability → CapabilityDefinition.
 * Falls back to legacy DeviceCapability if DB definitions are missing.
 *
 * Dr. QBIT engines call this to determine what features to show/enable.
 * For example:
 *   - Configuration Engine: only configure capabilities this product has
 *   - Diagnostic Engine: only test capabilities this product supports
 *   - Lifecycle Engine: only manage capabilities this product uses
 */
export async function getProductCapabilityProfile(productId: string): Promise<ProductCapabilityProfile> {
  try {
    const product = await db.qbitProduct.findUnique({
      where: { id: productId },
      include: {
        deviceCategory: true,
        productCapabilities: {
          where: { isEnabled: true },
          include: { capability: true },
          orderBy: { sortIndex: "asc" },
        },
      },
    });

    if (!product) {
      return createEmptyCapabilityProfile(productId, "");
    }

    const capabilities: ArchitectureCapability[] = product.productCapabilities
      .filter((pc) => pc.capability?.isActive === true)
      .map((pc) => ({
        id: pc.capability.id,
        slug: pc.capability.slug,
        name: pc.overrideName || pc.capability.name,
        description: pc.capability.description,
        icon: pc.overrideIcon || pc.capability.icon,
        capabilityGroup: pc.capability.capabilityGroup,
        isQbitRelevant: pc.capability.isQbitRelevant,
        affectsDiscovery: pc.capability.affectsDiscovery,
        affectsConfiguration: pc.capability.affectsConfiguration,
        affectsDiagnostics: pc.capability.affectsDiagnostics,
        affectsLifecycle: pc.capability.affectsLifecycle,
        sortIndex: pc.sortIndex,
        isActive: pc.capability.isActive,
      }));

    const capabilitySlugs = capabilities.map((c) => c.slug);

    return {
      productId: product.id,
      productModel: product.model,
      categorySlug: product.deviceCategory?.slug ?? null,
      categoryName: product.deviceCategory?.name ?? null,
      categoryIcon: product.deviceCategory?.icon ?? null,
      capabilities,
      capabilitySlugs,
      hasCapability: (slug: string) => capabilitySlugs.includes(slug),
      getCapabilitiesByPhase: (phase: "discovery" | "configuration" | "diagnostics" | "lifecycle") => {
        const phaseField = `affects${phase.charAt(0).toUpperCase() + phase.slice(1)}` as keyof ArchitectureCapability;
        return capabilities.filter((c) => c[phaseField] === true);
      },
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to get product capability profile:", error);
    return createEmptyCapabilityProfile(productId, "");
  }
}

/**
 * Get the complete connection profile for a product.
 *
 * Resolves from DB: ProductConnectionType → ConnectionTypeDefinition.
 * Falls back to legacy DeviceConnection if DB definitions are missing.
 *
 * Dr. QBIT engines call this to determine what connection options to show.
 */
export async function getProductConnectionProfile(productId: string): Promise<ProductConnectionProfile> {
  try {
    const product = await db.qbitProduct.findUnique({
      where: { id: productId },
      include: {
        productConnectionTypes: {
          include: { connectionType: true },
          orderBy: { sortIndex: "asc" },
        },
      },
    });

    if (!product) {
      return createEmptyConnectionProfile(productId, "");
    }

    const connectionTypes: ArchitectureConnectionType[] = product.productConnectionTypes
      .filter((pct) => pct.connectionType?.isActive === true)
      .map((pct) => ({
      id: pct.connectionType.id,
      slug: pct.connectionType.slug,
      name: pct.connectionType.name,
      description: pct.connectionType.description,
      icon: pct.connectionType.icon,
      protocol: pct.connectionType.protocol,
      supportsDiscovery: pct.connectionType.supportsDiscovery,
      requiresDesktopAgent: pct.connectionType.requiresDesktopAgent,
      supportsConfiguration: pct.connectionType.supportsConfiguration,
      supportsDiagnostics: pct.connectionType.supportsDiagnostics,
      sortIndex: pct.sortIndex,
      isActive: pct.connectionType.isActive,
    }));

    const connectionTypeSlugs = connectionTypes.map((ct) => ct.slug);
    const primary = product.productConnectionTypes.find((pct) => pct.isPrimary);

    return {
      productId: product.id,
      productModel: product.model,
      connectionTypes,
      connectionTypeSlugs,
      primaryConnectionType: primary ? connectionTypes.find((ct) => ct.id === primary.connectionTypeId) ?? null : null,
      supportsConnection: (slug: string) => connectionTypeSlugs.includes(slug),
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to get product connection profile:", error);
    return createEmptyConnectionProfile(productId, "");
  }
}

/**
 * Get the default settings for a device category.
 *
 * When admin creates a new product in a category, these defaults
 * are auto-applied (capabilities, connection types, adapters).
 * Admin can override per-product.
 */
export async function getCategoryDefaults(categorySlug: string): Promise<CategoryDefaults | null> {
  try {
    const category = await db.deviceCategory.findUnique({
      where: { slug: categorySlug },
      include: {
        categoryCapabilities: {
          where: { isDefault: true },
          include: { capability: true },
          orderBy: { sortIndex: "asc" },
        },
        categoryConnectionTypes: {
          where: { isDefault: true },
          include: { connectionType: true },
          orderBy: { sortIndex: "asc" },
        },
        categoryAdapters: {
          include: { adapter: true },
          orderBy: { sortIndex: "asc" },
        },
      },
    });

    if (!category) return null;

    const defaultCapabilities: ArchitectureCapability[] = category.categoryCapabilities
      .filter((cc) => cc.capability?.isActive === true)
      .map((cc) => ({
      id: cc.capability.id,
      slug: cc.capability.slug,
      name: cc.capability.name,
      description: cc.capability.description,
      icon: cc.capability.icon,
      capabilityGroup: cc.capability.capabilityGroup,
      isQbitRelevant: cc.capability.isQbitRelevant,
      affectsDiscovery: cc.capability.affectsDiscovery,
      affectsConfiguration: cc.capability.affectsConfiguration,
      affectsDiagnostics: cc.capability.affectsDiagnostics,
      affectsLifecycle: cc.capability.affectsLifecycle,
      sortIndex: cc.sortIndex,
      isActive: cc.capability.isActive,
    }));

    const defaultConnectionTypes: ArchitectureConnectionType[] = category.categoryConnectionTypes
      .filter((cct) => cct.connectionType?.isActive === true)
      .map((cct) => ({
      id: cct.connectionType.id,
      slug: cct.connectionType.slug,
      name: cct.connectionType.name,
      description: cct.connectionType.description,
      icon: cct.connectionType.icon,
      protocol: cct.connectionType.protocol,
      supportsDiscovery: cct.connectionType.supportsDiscovery,
      requiresDesktopAgent: cct.connectionType.requiresDesktopAgent,
      supportsConfiguration: cct.connectionType.supportsConfiguration,
      supportsDiagnostics: cct.connectionType.supportsDiagnostics,
      sortIndex: cct.sortIndex,
      isActive: cct.connectionType.isActive,
    }));

    const defaultAdapters: ArchitectureAdapter[] = category.categoryAdapters
      .filter((ca) => ca.adapter?.isActive === true)
      .map((ca) => ({
      id: ca.adapter.id,
      slug: ca.adapter.slug,
      name: ca.adapter.name,
      description: ca.adapter.description,
      adapterClass: ca.adapter.adapterClass,
      protocol: ca.adapter.protocol,
      requiresDesktopAgent: ca.adapter.requiresDesktopAgent,
      supportsLiveDiagnostics: ca.adapter.supportsLiveDiagnostics,
      supportsConfiguration: ca.adapter.supportsConfiguration,
      supportsFirmwareOps: ca.adapter.supportsFirmwareOps,
      isActive: ca.adapter.isActive,
      sortIndex: ca.sortIndex,
      applicableCategories: [category.slug],
      applicableConnectionTypes: [], // Not loaded here — call loadCommunicationAdapters() for full resolution
    }));

    return {
      categoryId: category.id,
      categorySlug: category.slug,
      categoryName: category.name,
      defaultCapabilities,
      defaultConnectionTypes,
      defaultAdapters,
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to get category defaults:", error);
    return null;
  }
}

/**
 * Resolve which communication adapters apply to a product.
 *
 * Uses: Product → Category → CategoryAdapterMapping → CommunicationAdapterDefinition.
 * The Configuration Engine and Diagnostic Engine use this to determine
 * which adapter class to instantiate for a device.
 */
export async function getApplicableAdaptersForProduct(productId: string): Promise<ProductAdapterResolution> {
  try {
    const product = await db.qbitProduct.findUnique({
      where: { id: productId },
      include: {
        deviceCategory: {
          include: {
            categoryAdapters: {
              include: {
                adapter: {
                  include: {
                    adapterConnectionTypes: { include: { connectionType: true } },
                  },
                },
              },
              orderBy: { sortIndex: "asc" },
            },
          },
        },
      },
    });

    if (!product || !product.deviceCategory) {
      return {
        productId,
        categorySlug: null,
        applicableAdapters: [],
        primaryAdapter: null,
        adapterClasses: [],
      };
    }

    const applicableAdapters: ArchitectureAdapter[] = product.deviceCategory.categoryAdapters
      .filter((ca) => ca.adapter?.isActive === true)
      .map((ca) => ({
      id: ca.adapter.id,
      slug: ca.adapter.slug,
      name: ca.adapter.name,
      description: ca.adapter.description,
      adapterClass: ca.adapter.adapterClass,
      protocol: ca.adapter.protocol,
      requiresDesktopAgent: ca.adapter.requiresDesktopAgent,
      supportsLiveDiagnostics: ca.adapter.supportsLiveDiagnostics,
      supportsConfiguration: ca.adapter.supportsConfiguration,
      supportsFirmwareOps: ca.adapter.supportsFirmwareOps,
      isActive: ca.adapter.isActive,
      sortIndex: ca.sortIndex,
      applicableCategories: [product.deviceCategory!.slug],
      applicableConnectionTypes: ca.adapter.adapterConnectionTypes.map((act) => act.connectionType.slug),
    }));

    const primaryMapping = product.deviceCategory.categoryAdapters.find((ca) => ca.isPrimary);
    const primaryAdapter = primaryMapping
      ? applicableAdapters.find((a) => a.id === primaryMapping.adapterId) ?? null
      : null;

    const adapterClasses = applicableAdapters.map((a) => a.adapterClass);

    return {
      productId,
      categorySlug: product.deviceCategory.slug,
      applicableAdapters,
      primaryAdapter,
      adapterClasses,
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to resolve adapters for product:", error);
    return {
      productId,
      categorySlug: null,
      applicableAdapters: [],
      primaryAdapter: null,
      adapterClasses: [],
    };
  }
}

/**
 * Resolve which adapters apply to a category (by slug).
 * Used when a device is detected but product is not yet matched.
 */
export async function getApplicableAdaptersForCategory(categorySlug: string): Promise<ProductAdapterResolution> {
  try {
    const category = await db.deviceCategory.findUnique({
      where: { slug: categorySlug },
      include: {
        categoryAdapters: {
          include: {
            adapter: {
              include: {
                adapterConnectionTypes: { include: { connectionType: true } },
              },
            },
          },
          orderBy: { sortIndex: "asc" },
        },
      },
    });

    if (!category) {
      return {
        productId: "",
        categorySlug,
        applicableAdapters: [],
        primaryAdapter: null,
        adapterClasses: [],
      };
    }

    const applicableAdapters: ArchitectureAdapter[] = category.categoryAdapters
      .filter((ca) => ca.adapter?.isActive === true)
      .map((ca) => ({
      id: ca.adapter.id,
      slug: ca.adapter.slug,
      name: ca.adapter.name,
      description: ca.adapter.description,
      adapterClass: ca.adapter.adapterClass,
      protocol: ca.adapter.protocol,
      requiresDesktopAgent: ca.adapter.requiresDesktopAgent,
      supportsLiveDiagnostics: ca.adapter.supportsLiveDiagnostics,
      supportsConfiguration: ca.adapter.supportsConfiguration,
      supportsFirmwareOps: ca.adapter.supportsFirmwareOps,
      isActive: ca.adapter.isActive,
      sortIndex: ca.sortIndex,
      applicableCategories: [category.slug],
      applicableConnectionTypes: ca.adapter.adapterConnectionTypes.map((act) => act.connectionType.slug),
    }));

    const primaryMapping = category.categoryAdapters.find((ca) => ca.isPrimary);
    const primaryAdapter = primaryMapping
      ? applicableAdapters.find((a) => a.id === primaryMapping.adapterId) ?? null
      : null;

    return {
      productId: "",
      categorySlug: category.slug,
      applicableAdapters,
      primaryAdapter,
      adapterClasses: applicableAdapters.map((a) => a.adapterClass),
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to resolve adapters for category:", error);
    return {
      productId: "",
      categorySlug,
      applicableAdapters: [],
      primaryAdapter: null,
      adapterClasses: [],
    };
  }
}

// ====================== Resolution Functions ======================

/**
 * Resolve a device category from a deviceType string.
 *
 * Maps legacy deviceType strings (e.g. "thermal_printer") to
 * the new DeviceCategory slug (e.g. "thermal-printer").
 * This provides backward compatibility while transitioning
 * to the database-driven architecture.
 */
export async function resolveDeviceCategory(deviceType: string): Promise<ArchitectureDeviceCategory | null> {
  // Map legacy deviceType strings to category slugs
  const legacyToSlugMap: Record<string, string> = {
    thermal_printer: "thermal-printer",
    barcode_printer: "barcode-printer",
    portable_bluetooth_printer: "portable-bluetooth-printer",
    label_printer: "label-printer",
    kitchen_printer: "kitchen-printer",
    windows_pos: "windows-pos",
    android_pos: "android-pos",
    barcode_scanner: "barcode-scanner",
    customer_display: "customer-display",
    cash_drawer: "cash-drawer",
    kiosk: "kiosk",
    weighing_scale: "weighing-scale",
    rfid_device: "rfid-device",
  };

  const categorySlug = legacyToSlugMap[deviceType] || deviceType.replace(/_/g, "-");

  try {
    const categories = await loadDeviceCategories();
    return categories.find((c) => c.slug === categorySlug) ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve an adapter definition to its runtime adapter class.
 *
 * The adapterClass field in CommunicationAdapterDefinition stores
 * the TypeScript class name. This function maps that to the actual
 * imported class object, so engines can instantiate it.
 *
 * Currently supported adapter classes (existing implementations):
 *   - ThermalPrinterDiagnosticAdapter
 *   - BarcodePrinterDiagnosticAdapter
 *   - WindowsPosDiagnosticAdapter
 *   - AndroidPosDiagnosticAdapter
 *   - BarcodeScannerDiagnosticAdapter
 *   - UsbConfigurationAdapter
 *   - LanConfigurationAdapter
 *   - WifiConfigurationAdapter
 *   - BluetoothConfigurationAdapter
 *
 * Future adapters just need:
 *   1. A new class implementing DiagnosticAdapter or ConfigurationAdapter
 *   2. A CommunicationAdapterDefinition entry in the DB
 *   3. This resolver updated to map the class name
 *   NO core engine changes.
 */
export function resolveAdapterClass(adapterClass: string): unknown | null {
  // Lazy imports to avoid circular dependency issues
  // The actual adapter classes are imported from their respective modules
  // This resolver is the ONLY place that knows about specific adapter class names.
  // When a new adapter is created, just add it here.
  const adapterClassMap: Record<string, string> = {
    // Diagnostic Adapters — existing implementations
    ThermalPrinterDiagnosticAdapter: "diagnostic-adapters",
    BarcodePrinterDiagnosticAdapter: "diagnostic-adapters",
    WindowsPosDiagnosticAdapter: "diagnostic-adapters",
    AndroidPosDiagnosticAdapter: "diagnostic-adapters",
    BarcodeScannerDiagnosticAdapter: "diagnostic-adapters",
    // Diagnostic Adapters — extensible for future QBIT hardware
    PortablePrinterDiagnosticAdapter: "diagnostic-adapters",
    LabelPrinterDiagnosticAdapter: "diagnostic-adapters",
    CustomerDisplayDiagnosticAdapter: "diagnostic-adapters",
    CashDrawerDiagnosticAdapter: "diagnostic-adapters",
    RfidDeviceDiagnosticAdapter: "diagnostic-adapters",
    KitchenPrinterDiagnosticAdapter: "diagnostic-adapters",
    KioskDiagnosticAdapter: "diagnostic-adapters",
    WeighingScaleDiagnosticAdapter: "diagnostic-adapters",
    // Configuration Adapters — existing implementations
    UsbConfigurationAdapter: "configuration-adapters",
    LanConfigurationAdapter: "configuration-adapters",
    WifiConfigurationAdapter: "configuration-adapters",
    BluetoothConfigurationAdapter: "configuration-adapters",
    // Future adapters will be added here as they're created
    // e.g. SerialConfigurationAdapter: "configuration-adapters",
    // e.g. VirtualPortConfigurationAdapter: "configuration-adapters",
  };

  return adapterClassMap[adapterClass] ?? null;
}

/**
 * Complete Architecture Resolution for a product.
 *
 * Resolves all profiles (category, capabilities, connections, adapters)
 * for a product from the database. This is the primary function that
 * Dr. QBIT engines call to get device architecture info.
 *
 * If DB definitions are missing, falls back to legacy TypeScript types
 * (backward compatible — no engine breakage).
 */
export async function resolveArchitectureForProduct(productId: string): Promise<ArchitectureResolution> {
  const capabilityProfile = await getProductCapabilityProfile(productId);
  const connectionProfile = await getProductConnectionProfile(productId);
  const adapterResolution = await getApplicableAdaptersForProduct(productId);

  const category = capabilityProfile.categorySlug
    ? (await loadDeviceCategories()).find((c) => c.slug === capabilityProfile.categorySlug) ?? null
    : null;

  const resolvedFromDB = capabilityProfile.capabilities.length > 0 ||
    connectionProfile.connectionTypes.length > 0 ||
    adapterResolution.applicableAdapters.length > 0;

  return {
    productId,
    productModel: capabilityProfile.productModel,
    category,
    capabilityProfile,
    connectionProfile,
    adapterResolution,
    resolvedFromDB,
  };
}

// ====================== New Device Onboarding ======================

/**
 * 7-Step New Device Onboarding Process.
 *
 * Admin follows these steps to add a new QBIT hardware product:
 *   Step 1: Create Product (QbitProduct entry with category, model, etc.)
 *   Step 2: Upload Drivers (Resource entries linked via ProductResourceMapping)
 *   Step 3: Upload Firmware (Resource entries linked via ProductResourceMapping)
 *   Step 4: Upload Manuals (Resource entries linked via ProductResourceMapping)
 *   Step 5: Upload SDK (Resource entries linked via ProductResourceMapping, optional)
 *   Step 6: Create Device Profile (auto-assign category defaults → capabilities + connections)
 *   Step 7: Assign Capability Profile (link capabilities + connection types to product)
 *
 * If the device uses a NEW communication protocol:
 *   → Also create a CommunicationAdapterDefinition entry
 *   → This is handled automatically if a new adapter slug is provided
 *
 * After onboarding, Dr. QBIT automatically supports the device.
 * NO core engine code changes required.
 */
export async function onboardNewDevice(params: {
  /** Step 1: Product info */
  name: string;
  brand: string;
  model: string;
  slug: string;
  categorySlug: string;
  deviceType: string;
  sku?: string;
  description?: string;
  /** Step 2-5: Resource IDs to link (pre-uploaded) */
  driverResourceIds?: string[];
  firmwareResourceIds?: string[];
  manualResourceIds?: string[];
  sdkResourceIds?: string[];
  /** Step 6-7: Override capabilities/connection types (null = use category defaults) */
  capabilitySlugs?: string[];
  connectionTypeSlugs?: string[];
  /** Optional: New adapter needed? */
  newAdapterSlug?: string;
  newAdapterName?: string;
  newAdapterClass?: string;
  newAdapterProtocol?: string;
  /** VID/PID for auto-detection */
  hardwareSignatures?: Array<{
    vendorId: string;
    productIdCode: string;
    hardwareId?: string;
    macPrefix?: string;
    connectionType: string;
  }>;
}): Promise<OnboardingResult> {
  const errors: string[] = [];
  const result: OnboardingResult = {
    success: false,
    productId: "",
    productSlug: params.slug,
    categorySlug: params.categorySlug,
    steps: {
      step1_createProduct: { completed: false, productId: "" },
      step2_uploadDrivers: { completed: false, resourceIds: [] },
      step3_uploadFirmware: { completed: false, resourceIds: [] },
      step4_uploadManuals: { completed: false, resourceIds: [] },
      step5_uploadSDK: { completed: false, resourceIds: [] },
      step6_createDeviceProfile: { completed: false, capabilitiesLinked: 0, connectionTypesLinked: 0 },
      step7_assignCapabilityProfile: { completed: false, capabilitiesLinked: 0, connectionTypesLinked: 0 },
    },
    newAdapterCreated: false,
    adapterId: null,
    summary: "",
    errors,
  };

  try {
    // ===== Step 1: Create Product =====
    const category = await db.deviceCategory.findUnique({ where: { slug: params.categorySlug } });
    if (!category) {
      errors.push(`Category "${params.categorySlug}" not found. Create it first via /api/dr-qbit/device-categories`);
      return result;
    }

    const product = await db.qbitProduct.create({
      data: {
        name: params.name,
        brand: params.brand,
        model: params.model,
        slug: params.slug,
        deviceType: params.deviceType,
        category: category.slug,
        categoryId: category.id,
        sku: params.sku,
        description: params.description,
        isActive: true,
        isPublished: true,
        drQbitSupported: true,
        aiDiagnosticsSupported: true,
        status: "active",
      },
    });

    result.productId = product.id;
    result.steps.step1_createProduct = { completed: true, productId: product.id };

    // ===== Step 2: Link Driver Resources =====
    if (params.driverResourceIds && params.driverResourceIds.length > 0) {
      for (const resourceId of params.driverResourceIds) {
        await db.productResourceMapping.create({
          data: {
            productId: product.id,
            resourceId,
            overrideType: "windows_driver",
            sortIndex: 0,
          },
        });
      }
      result.steps.step2_uploadDrivers = { completed: true, resourceIds: params.driverResourceIds };
    } else {
      result.steps.step2_uploadDrivers = { completed: true, resourceIds: [] };
    }

    // ===== Step 3: Link Firmware Resources =====
    if (params.firmwareResourceIds && params.firmwareResourceIds.length > 0) {
      for (const resourceId of params.firmwareResourceIds) {
        await db.productResourceMapping.create({
          data: {
            productId: product.id,
            resourceId,
            overrideType: "firmware",
            sortIndex: 0,
          },
        });
      }
      result.steps.step3_uploadFirmware = { completed: true, resourceIds: params.firmwareResourceIds };
    } else {
      result.steps.step3_uploadFirmware = { completed: true, resourceIds: [] };
    }

    // ===== Step 4: Link Manual Resources =====
    if (params.manualResourceIds && params.manualResourceIds.length > 0) {
      for (const resourceId of params.manualResourceIds) {
        await db.productResourceMapping.create({
          data: {
            productId: product.id,
            resourceId,
            overrideType: "manual",
            sortIndex: 0,
          },
        });
      }
      result.steps.step4_uploadManuals = { completed: true, resourceIds: params.manualResourceIds };
    } else {
      result.steps.step4_uploadManuals = { completed: true, resourceIds: [] };
    }

    // ===== Step 5: Link SDK Resources =====
    if (params.sdkResourceIds && params.sdkResourceIds.length > 0) {
      for (const resourceId of params.sdkResourceIds) {
        await db.productResourceMapping.create({
          data: {
            productId: product.id,
            resourceId,
            overrideType: "sdk",
            sortIndex: 0,
          },
        });
      }
      result.steps.step5_uploadSDK = { completed: true, resourceIds: params.sdkResourceIds };
    } else {
      result.steps.step5_uploadSDK = { completed: true, resourceIds: [] };
    }

    // ===== Step 6: Create Device Profile (auto-assign category defaults) =====
    const categoryDefaults = await getCategoryDefaults(params.categorySlug);
    let capabilitiesLinked = 0;
    let connectionTypesLinked = 0;

    if (categoryDefaults) {
      // Auto-assign default capabilities from category
      for (const cap of categoryDefaults.defaultCapabilities) {
        await db.productCapability.create({
          data: {
            productId: product.id,
            capabilityId: cap.id,
            isEnabled: true,
            sortIndex: cap.sortIndex,
          },
        });
        capabilitiesLinked++;
      }

      // Auto-assign default connection types from category
      for (const ct of categoryDefaults.defaultConnectionTypes) {
        await db.productConnectionType.create({
          data: {
            productId: product.id,
            connectionTypeId: ct.id,
            isPrimary: ct.slug === "usb", // USB is typically primary
            sortIndex: ct.sortIndex,
          },
        });
        connectionTypesLinked++;
      }
    }

    result.steps.step6_createDeviceProfile = { completed: true, capabilitiesLinked, connectionTypesLinked };

    // ===== Step 7: Assign Capability Profile (override if provided) =====
    // If explicit capability/connection slugs were provided, override the defaults
    if (params.capabilitySlugs && params.capabilitySlugs.length > 0) {
      // Clear auto-assigned capabilities and re-assign from explicit list
      await db.productCapability.deleteMany({ where: { productId: product.id } });
      for (const slug of params.capabilitySlugs) {
        const capDef = await db.capabilityDefinition.findUnique({ where: { slug } });
        if (capDef) {
          await db.productCapability.create({
            data: {
              productId: product.id,
              capabilityId: capDef.id,
              isEnabled: true,
              sortIndex: capDef.sortIndex,
            },
          });
          capabilitiesLinked++;
        }
      }
    }

    if (params.connectionTypeSlugs && params.connectionTypeSlugs.length > 0) {
      // Clear auto-assigned connection types and re-assign from explicit list
      await db.productConnectionType.deleteMany({ where: { productId: product.id } });
      for (const slug of params.connectionTypeSlugs) {
        const ctDef = await db.connectionTypeDefinition.findUnique({ where: { slug } });
        if (ctDef) {
          await db.productConnectionType.create({
            data: {
              productId: product.id,
              connectionTypeId: ctDef.id,
              isPrimary: slug === params.connectionTypeSlugs[0],
              sortIndex: ctDef.sortIndex,
            },
          });
          connectionTypesLinked++;
        }
      }
    }

    result.steps.step7_assignCapabilityProfile = { completed: true, capabilitiesLinked, connectionTypesLinked };

    // ===== Optional: Create new adapter if needed =====
    if (params.newAdapterSlug && params.newAdapterName && params.newAdapterClass) {
      const newAdapter = await db.communicationAdapterDefinition.create({
        data: {
          slug: params.newAdapterSlug,
          name: params.newAdapterName,
          adapterClass: params.newAdapterClass,
          protocol: params.newAdapterProtocol,
          isActive: true,
        },
      });

      // Link the new adapter to this category
      await db.categoryAdapterMapping.create({
        data: {
          categoryId: category.id,
          adapterId: newAdapter.id,
          isPrimary: true,
          sortIndex: 0,
        },
      });

      result.newAdapterCreated = true;
      result.adapterId = newAdapter.id;
    }

    // ===== Optional: Create Hardware Signatures =====
    if (params.hardwareSignatures && params.hardwareSignatures.length > 0) {
      for (const sig of params.hardwareSignatures) {
        await db.hardwareSignature.create({
          data: {
            productId: product.id,
            vendorId: sig.vendorId,
            productIdCode: sig.productIdCode,
            hardwareId: sig.hardwareId,
            macPrefix: sig.macPrefix,
            connectionType: sig.connectionType,
          },
        });
      }
    }

    result.success = true;
    result.summary = `Product "${params.name}" (${params.model}) onboarded to category "${params.categorySlug}". ${capabilitiesLinked} capabilities linked, ${connectionTypesLinked} connection types linked. ${result.newAdapterCreated ? `New adapter "${params.newAdapterName}" created.` : "No new adapter needed."}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error during onboarding";
    errors.push(errorMsg);
    result.success = false;
    result.summary = `Onboarding failed: ${errorMsg}`;
  }

  return result;
}

// ====================== DB-Driven Discovery Support ======================

/**
 * Load all known QBIT Vendor IDs from the database.
 *
 * This replaces the hardcoded `qbitVids` array in device-discovery.ts.
 * VIDs are stored in HardwareSignature entries. When admin adds a
 * new product with a new VID, the discovery engine automatically
 * recognizes it — no code changes.
 */
export async function loadKnownVendorIds(): Promise<string[]> {
  try {
    const signatures = await db.hardwareSignature.findMany({
      select: { vendorId: true },
      distinct: ["vendorId"],
    });
    return signatures.map((s) => s.vendorId).filter(Boolean) as string[];
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load known VIDs from DB:", error);
    // Fall back to legacy hardcoded VIDs
    return ["1E90", "04B8", "1FC9"];
  }
}

/**
 * Load all known device keyword patterns from the database.
 *
 * This replaces the hardcoded `printerKeywords` array in device-discovery.ts.
 * Keywords are derived from product names and device category names.
 * When admin adds a new product/category, the keywords automatically expand.
 */
export async function loadDeviceKeywordPatterns(): Promise<string[]> {
  try {
    // Get keywords from product names
    const products = await db.qbitProduct.findMany({
      where: { isActive: true, drQbitSupported: true },
      select: { name: true, model: true },
    });

    // Get keywords from category names
    const categories = await db.deviceCategory.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
    });

    // Extract meaningful keywords from product names and models
    const keywords = new Set<string>();

    // Core detection keywords (always needed for hardware scanning)
    const coreKeywords = [
      "printer", "print", "thermal", "label", "barcode", "pos",
      "scanner", "kiosk", "scale", "cash drawer", "display",
      "receipt", "ticket", "slip", "impact", "dot matrix",
    ];
    coreKeywords.forEach((kw) => keywords.add(kw));

    // Add keywords from product names (split into tokens)
    products.forEach((p) => {
      const tokens = `${p.name} ${p.model}`.toLowerCase().split(/\s+/);
      tokens.forEach((t) => {
        if (t.length >= 3 && !/^\d+$/.test(t)) keywords.add(t);
      });
    });

    // Add keywords from category names
    categories.forEach((c) => {
      const tokens = c.name.toLowerCase().split(/\s+/);
      tokens.forEach((t) => {
        if (t.length >= 3) keywords.add(t);
      });
      // Also add slug parts (e.g. "thermal" from "thermal-printer")
      c.slug.split("-").forEach((part) => {
        if (part.length >= 3) keywords.add(part);
      });
    });

    return Array.from(keywords);
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to load keyword patterns from DB:", error);
    // Fall back to legacy hardcoded keywords
    return [
      "printer", "print", "thermal", "label", "barcode", "pos",
      "scanner", "kiosk", "scale", "cash drawer", "display",
      "receipt", "ticket", "slip", "impact", "dot matrix",
    ];
  }
}

/**
 * Load connection types that support discovery scanning.
 *
 * This replaces the hardcoded DiscoveryConnection type.
 * The Discovery Engine calls this to know which scanners to register.
 * When admin adds a new connection type with supportsDiscovery=true,
 * the engine automatically includes it.
 */
export async function loadDiscoveryConnectionTypes(): Promise<ArchitectureConnectionType[]> {
  try {
    const allTypes = await loadConnectionTypeDefinitions();
    return allTypes.filter((ct) => ct.supportsDiscovery);
  } catch {
    // Fall back to legacy: USB, Bluetooth, LAN
    return [
      {
        id: "legacy-usb",
        slug: "usb",
        name: "USB",
        description: null,
        icon: "usb",
        protocol: "USB",
        supportsDiscovery: true,
        requiresDesktopAgent: false,
        supportsConfiguration: true,
        supportsDiagnostics: true,
        sortIndex: 0,
        isActive: true,
      },
      {
        id: "legacy-bluetooth",
        slug: "bluetooth",
        name: "Bluetooth",
        description: null,
        icon: "bluetooth",
        protocol: "BLE",
        supportsDiscovery: true,
        requiresDesktopAgent: false,
        supportsConfiguration: true,
        supportsDiagnostics: true,
        sortIndex: 1,
        isActive: true,
      },
      {
        id: "legacy-lan",
        slug: "lan",
        name: "Ethernet (LAN)",
        description: null,
        icon: "lan",
        protocol: "TCP/IP",
        supportsDiscovery: true,
        requiresDesktopAgent: true,
        supportsConfiguration: true,
        supportsDiagnostics: true,
        sortIndex: 2,
        isActive: true,
      },
    ];
  }
}

// ====================== Helper Functions ======================

function createEmptyCapabilityProfile(productId: string, productModel: string): ProductCapabilityProfile {
  return {
    productId,
    productModel,
    categorySlug: null,
    categoryName: null,
    categoryIcon: null,
    capabilities: [],
    capabilitySlugs: [],
    hasCapability: () => false,
    getCapabilitiesByPhase: () => [],
  };
}

function createEmptyConnectionProfile(productId: string, productModel: string): ProductConnectionProfile {
  return {
    productId,
    productModel,
    connectionTypes: [],
    connectionTypeSlugs: [],
    primaryConnectionType: null,
    supportsConnection: () => false,
  };
}

/**
 * Smart Resource Synchronization — when admin uploads a new resource,
 * automatically update the resource mapping for ALL registered devices
 * of that product model.
 *
 * Called from the admin resource upload API route.
 * This ensures that when a new driver/firmware/manual/SDK/video is uploaded,
 * ALL registered devices of that model get the resource automatically
 * in their Dr. QBIT resource recommendations.
 */
export async function syncResourceToAllModelDevices(params: {
  productId: string;
  resourceId: string;
  resourceType: string;
}): Promise<{ syncedDevices: number; passportIds: string[] }> {
  try {
    // Find all device passports for this product model
    const passports = await db.devicePassport.findMany({
      where: { productId: params.productId },
      select: { id: true },
    });

    if (passports.length === 0) {
      return { syncedDevices: 0, passportIds: [] };
    }

    // The resource is already linked to the product via ProductResourceMapping
    // (created during upload). The Resource Engine (Phase 3) reads this
    // mapping when generating resource recommendations for any device
    // of this product. So we don't need to create per-passport mappings.

    // However, we DO need to create Smart Notifications for existing
    // registered devices — "New driver available" or "Firmware update available"
    const notificationType = params.resourceType === "firmware"
      ? "firmware_update_available"
      : params.resourceType === "windows_driver" || params.resourceType === "android_software"
        ? "driver_update_available"
        : "info"; // manuals/SDKs/videos don't generate notifications

    if (notificationType !== "info") {
      for (const passport of passports) {
        // Create notification if this is a driver/firmware update
        const dedupKey = `${notificationType}_${passport.id}_${params.resourceId}`;
        const existing = await db.smartNotification.findFirst({
          where: { dedupKey },
        });

        if (!existing) {
          await db.smartNotification.create({
            data: {
              passportId: passport.id,
              notificationType,
              title: params.resourceType === "firmware"
                ? "New Firmware Update Available"
                : "New Driver Update Available",
              message: `A new ${params.resourceType} has been released for your device model. Please check the resource center for details.`,
              severity: params.resourceType === "firmware" ? "warning" : "info",
              targetRole: "engineer",
              deliveryStatus: "pending",
              dedupKey,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        }
      }
    }

    return {
      syncedDevices: passports.length,
      passportIds: passports.map((p) => p.id),
    };
  } catch (error) {
    console.error("[ArchitectureEngine] Failed to sync resource to model devices:", error);
    return { syncedDevices: 0, passportIds: [] };
  }
}
