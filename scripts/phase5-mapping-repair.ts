/**
 * Phase 5 — Product-Resource Mapping Repair (NON-DESTRUCTIVE)
 *
 * Currently only 8 ProductResourceMapping records exist. Most products
 * have no resource links. This script creates mappings based on
 * product category/deviceType.
 *
 * Run: DATABASE_URL="..." npx tsx scripts/phase5-mapping-repair.ts
 */

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient({ log: ['warn', 'error'] });

// Category-to-resource-type mapping logic
// Maps product deviceType to the types of resources they should have linked
const CATEGORY_RESOURCE_RULES: Record<string, { overrideType: string, resourceFilter: string }[]> = {
  'thermal_printer': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'firmware', resourceFilter: 'firmware' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'installation_guide', resourceFilter: 'installation_guide' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
    { overrideType: 'sdk', resourceFilter: 'sdk' },
    { overrideType: 'troubleshooting', resourceFilter: 'troubleshooting' },
  ],
  'barcode_scanner': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
    { overrideType: 'troubleshooting', resourceFilter: 'troubleshooting' },
  ],
  'pos_machine': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'firmware', resourceFilter: 'firmware' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
    { overrideType: 'installation_guide', resourceFilter: 'installation_guide' },
    { overrideType: 'troubleshooting', resourceFilter: 'troubleshooting' },
  ],
  'window_pos': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'firmware', resourceFilter: 'firmware' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
    { overrideType: 'installation_guide', resourceFilter: 'installation_guide' },
    { overrideType: 'sdk', resourceFilter: 'sdk' },
  ],
  'android_pos': [
    { overrideType: 'android_software', resourceFilter: 'android_software' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'installation_guide', resourceFilter: 'installation_guide' },
    { overrideType: 'sdk', resourceFilter: 'sdk' },
  ],
  'portable_printer': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'firmware', resourceFilter: 'firmware' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'troubleshooting', resourceFilter: 'troubleshooting' },
  ],
  'cash_drawer': [
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
  ],
  'customer_display': [
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
  ],
  'barcode_printer': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'firmware', resourceFilter: 'firmware' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'sdk', resourceFilter: 'sdk' },
  ],
  'label_printer': [
    { overrideType: 'windows_driver', resourceFilter: 'windows_driver' },
    { overrideType: 'manual', resourceFilter: 'manual' },
    { overrideType: 'pos_utility', resourceFilter: 'pos_utility' },
    { overrideType: 'sdk', resourceFilter: 'sdk' },
  ],
};

// Universal resources that should be linked to ALL products
const UNIVERSAL_RESOURCE_TYPES = [
  { overrideType: 'troubleshooting', resourceFilter: 'troubleshooting' },
  { overrideType: 'installation_guide', resourceFilter: 'installation_guide' },
];

async function main() {
  console.log('=== Phase 5: Product-Resource Mapping Repair ===\n');

  // Get all products and their existing mappings
  const products = await db.qbitProduct.findMany({
    select: { id: true, name: true, slug: true, deviceType: true, category: true },
  });
  
  const existingMappings = await db.productResourceMapping.findMany();
  const existingSet = new Set(existingMappings.map(m => `${m.productId}-${m.resourceId}`));
  
  console.log(`Products: ${products.length}`);
  console.log(`Existing mappings: ${existingMappings.length}`);
  
  // Get all resources
  const resources = await db.resource.findMany({
    select: { id: true, name: true, type: true, supportedCategories: true },
  });

  let totalCreated = 0;

  for (const product of products) {
    // Get existing mappings for this product
    const productExistingMappings = existingMappings.filter(m => m.productId === product.id);
    console.log(`\nProduct: "${product.name}" (slug=${product.slug}, deviceType=${product.deviceType}, category=${product.category}, existing mappings=${productExistingMappings.length})`);

    // Determine the rules to apply
    const deviceType = product.deviceType || '';
    const category = product.category || '';
    
    // Try deviceType first, then category
    let rules = CATEGORY_RESOURCE_RULES[deviceType] || CATEGORY_RESOURCE_RULES[category] || [];
    
    // Also add universal resources
    const allRules = [...rules, ...UNIVERSAL_RESOURCE_TYPES];

    let sortIndex = productExistingMappings.length > 0 ? productExistingMappings.length : 0;

    for (const rule of allRules) {
      // Find a matching resource
      // First try: resource that matches the type AND supportedCategories includes the product's category/deviceType
      const matchingResources = resources.filter(r => {
        if (r.type !== rule.resourceFilter) return false;
        
        // Check supportedCategories
        if (r.supportedCategories) {
          const cats = r.supportedCategories.split(',');
          // Check if the resource supports this product's category or deviceType
          if (cats.includes(category) || cats.includes(deviceType) || cats.includes(deviceType.replace('_', '-'))) {
            return true;
          }
          // Universal resources (null supportedCategories) match all
          if (r.supportedCategories === null) return true;
        }
        
        // If supportedCategories is null (universal), it matches
        return r.supportedCategories === null;
      });

      // If no category-specific match, find any resource of this type
      const resource = matchingResources.length > 0 
        ? matchingResources[0] 
        : resources.find(r => r.type === rule.resourceFilter);

      if (!resource) {
        console.log(`  SKIP: No resource found for type "${rule.resourceFilter}"`);
        continue;
      }

      // Check if mapping already exists
      const mappingKey = `${product.id}-${resource.id}`;
      if (existingSet.has(mappingKey)) {
        console.log(`  SKIP: Mapping already exists for "${rule.overrideType}" → "${resource.name}"`);
        continue;
      }

      // Create the mapping
      try {
        await db.productResourceMapping.create({
          data: {
            productId: product.id,
            resourceId: resource.id,
            overrideType: rule.overrideType,
            sortIndex: sortIndex,
          },
        });
        existingSet.add(mappingKey);
        sortIndex++;
        totalCreated++;
        console.log(`  CREATE: ${rule.overrideType} → "${resource.name}" (sortIndex=${sortIndex - 1})`);
      } catch (e: any) {
        // Might be a duplicate constraint violation
        console.log(`  WARN: Mapping failed for "${rule.overrideType}" → "${resource.name}" - ${e.message}`);
      }
    }
  }

  // Verification
  console.log('\n=== Phase 5 Verification ===');
  const finalMappingCount = await db.productResourceMapping.count();
  const productsWithMappings = await db.qbitProduct.findMany({
    select: { id: true, name: true, slug: true },
  });
  
  let productsWithAtLeastOne = 0;
  for (const p of productsWithMappings) {
    const count = await db.productResourceMapping.count({ where: { productId: p.id } });
    if (count > 0) productsWithAtLeastOne++;
    console.log(`  "${p.name}" (${p.slug}): ${count} mappings`);
  }
  
  console.log(`\nTotal ProductResourceMapping records: ${finalMappingCount}`);
  console.log(`Products with at least 1 mapping: ${productsWithAtLeastOne} / ${products.length}`);
  console.log(`New mappings created: ${totalCreated}`);
  console.log('\n=== Phase 5 Complete ===');
}

main()
  .catch((e) => { console.error('Phase 5 failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
