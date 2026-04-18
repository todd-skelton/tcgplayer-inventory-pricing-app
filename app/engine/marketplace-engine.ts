import type {
  TcgPlayerListingRaw,
  Listing,
  CardLock,
  MarketplacePricingConfig,
  SimpleMarketplacePricingConfig,
  ListingSummary,
} from "./types";
import { roundTo } from "./formatters";

// ============================================================
// CSV <-> Internal Mapping
// ============================================================

export function parseListingRow(raw: TcgPlayerListingRaw): Listing {
  const {
    "TCGplayer Id": tcgPlayerId,
    "Product Line": productLine,
    "Set Name": setName,
    "Product Name": productName,
    Title: title,
    Number: number,
    Rarity: rarity,
    Condition: condition,
    "TCG Market Price": tcgMarketPrice,
    "TCG Direct Low": tcgDirectLow,
    "TCG Low Price With Shipping": tcgLowPriceWithShipping,
    "TCG Low Price": tcgLowPrice,
    "Total Quantity": totalQuantity,
    "Add to Quantity": addToQuantity,
    "TCG Marketplace Price": tcgMarketplacePrice,
    "Photo URL": photoUrl,
    ...extra
  } = raw;

  return {
    tcgPlayerId,
    productLine,
    setName,
    productName,
    title,
    number,
    rarity,
    condition,
    tcgMarketPrice: parseFloat(tcgMarketPrice),
    tcgDirectLow: parseFloat(tcgDirectLow),
    tcgLowPriceWithShipping: parseFloat(tcgLowPriceWithShipping),
    tcgLowPrice: parseFloat(tcgLowPrice),
    totalQuantity: parseInt(totalQuantity, 10),
    addToQuantity: parseInt(addToQuantity, 10),
    tcgMarketplacePrice: parseFloat(tcgMarketplacePrice),
    currentMarketplacePrice: parseFloat(tcgMarketplacePrice),
    photoUrl,
    raw: extra,
  };
}

export function serializeListingRow(listing: Listing): TcgPlayerListingRaw {
  return {
    "TCGplayer Id": listing.tcgPlayerId,
    "Product Line": listing.productLine,
    "Set Name": listing.setName,
    "Product Name": listing.productName,
    Title: listing.title,
    Number: listing.number,
    Rarity: listing.rarity,
    Condition: listing.condition,
    "TCG Market Price": isNaN(listing.tcgMarketPrice)
      ? ""
      : listing.tcgMarketPrice.toFixed(2),
    "TCG Direct Low": isNaN(listing.tcgDirectLow)
      ? ""
      : listing.tcgDirectLow.toFixed(2),
    "TCG Low Price With Shipping": isNaN(listing.tcgLowPriceWithShipping)
      ? ""
      : listing.tcgLowPriceWithShipping.toFixed(2),
    "TCG Low Price": isNaN(listing.tcgLowPrice)
      ? ""
      : listing.tcgLowPrice.toFixed(2),
    "Total Quantity": isNaN(listing.totalQuantity)
      ? ""
      : listing.totalQuantity.toFixed(0),
    "Add to Quantity": isNaN(listing.addToQuantity)
      ? ""
      : listing.addToQuantity.toFixed(0),
    "TCG Marketplace Price": isNaN(listing.tcgMarketplacePrice)
      ? ""
      : listing.tcgMarketplacePrice.toFixed(2),
    "Photo URL": listing.photoUrl,
    ...listing.raw,
  };
}

// ============================================================
// Prefilter: Which items should be processed?
// ============================================================

export function prefilterListing(
  listing: Listing,
  config: MarketplacePricingConfig
): { pass: boolean; reason?: string } {
  // Must have stock
  if (listing.totalQuantity <= 0 && listing.addToQuantity <= 0) {
    return { pass: false, reason: "Out of stock" };
  }

  // Must not be excluded
  if (config.excludedIds.includes(listing.tcgPlayerId)) {
    return { pass: false, reason: "Excluded item" };
  }

  return { pass: true };
}

// ============================================================
// Pricing Logic: Calculate new price
// ============================================================

export function calculateMarketplacePrice(
  listing: Listing,
  config: MarketplacePricingConfig
): void {
  listing.previousMarketplacePrice = listing.currentMarketplacePrice;

  // Guard: max price lock - don't reprice expensive items
  if (listing.tcgMarketplacePrice >= config.maxPriceLock) {
    listing.skippedReason = `Price >= $${config.maxPriceLock} lock`;
    return;
  }

  // Guard: product line filter
  if (listing.productLine !== config.allowedProductLine) {
    listing.skippedReason = `Not ${config.allowedProductLine}`;
    return;
  }

  // Guard: skip titled items (promo cards with custom titles)
  if (config.skipTitledItems && listing.title && listing.title.trim() !== "") {
    listing.skippedReason = "Has custom title";
    return;
  }

  // Guard: require both prices
  if (
    config.requireBothPrices &&
    (isNaN(listing.tcgMarketPrice) || isNaN(listing.tcgLowPrice))
  ) {
    listing.skippedReason = "Missing market or low price";
    return;
  }

  // Step 1: Determine set prefix
  const setPrefix = listing.number.substring(0, 3).toUpperCase();

  // Step 2: Determine rarity floor
  const rarityFloor = getRarityFloor(
    setPrefix,
    listing.rarity.trim(),
    config
  );

  // Step 3: Calculate best low price (adjust for shipping on cheap items)
  const bestLow =
    listing.tcgLowPrice < 5
      ? listing.tcgLowPriceWithShipping - config.lowShippingAdjust
      : listing.tcgLowPriceWithShipping;

  // Step 4: Undercut logic
  let targetPrice: number;
  if (config.undercutEnabled) {
    const shouldUndercut =
      bestLow >= listing.tcgMarketPrice * config.undercutThreshold;
    targetPrice = shouldUndercut ? bestLow - 0.01 : listing.tcgMarketPrice;
  } else {
    targetPrice = listing.tcgMarketPrice;
  }

  // Step 5: Drop protection
  const isDropProtected = config.dropProtectionEnabled &&
    config.dropProtectionSets.includes(setPrefix);
  if (
    isDropProtected &&
    targetPrice < listing.tcgMarketplacePrice * config.dropProtectionThreshold
  ) {
    targetPrice = listing.tcgMarketplacePrice;
  }

  // Step 6: Apply rarity floor
  targetPrice = Math.max(rarityFloor, targetPrice);

  // Step 7a: Set lock – block all changes for locked sets
  if (isSetLocked(listing.setName, config.lockedSets ?? [])) {
    listing.skippedReason = "Set locked";
    return;
  }

  // Step 7b: Card lock – block all changes for locked cards (by number + rarity)
  if (isCardLocked(listing.number, listing.rarity, config.lockedCards ?? [])) {
    listing.skippedReason = "Card locked";
    return;
  }

  // Step 8: Assign final price
  listing.tcgMarketplacePrice = roundTo(targetPrice, 2);
}

export function isSetLocked(
  setName: string,
  lockedSets: string[]
): boolean {
  return lockedSets.includes(setName);
}

export function isCardLocked(
  number: string,
  rarity: string,
  lockedCards: CardLock[]
): boolean {
  return lockedCards.some(
    (c) => c.number === number && c.rarity === rarity
  );
}

function getRarityFloor(
  setPrefix: string,
  rarity: string,
  config: MarketplacePricingConfig
): number {
  // Check set-specific overrides first
  const setOverride = config.setOverrides.find(
    (s) => s.setPrefix === setPrefix
  );
  if (setOverride) {
    // If this set has no rarity-specific floors, use its default
    if (setOverride.rarityFloors.length === 0) {
      return setOverride.defaultFloor;
    }
    const rarityMatch = setOverride.rarityFloors.find(
      (r) => r.rarity === rarity
    );
    return rarityMatch ? rarityMatch.floor : setOverride.defaultFloor;
  }

  // Check common rarity floors
  const commonMatch = config.rarityFloors.find((r) => r.rarity === rarity);
  if (commonMatch) {
    return commonMatch.floor;
  }

  return config.defaultRarityFloor;
}

// ============================================================
// Simple Marketplace Pricing (for "With My Store" mode)
// ============================================================

export function calculateSimpleMarketplacePrice(
  listing: Listing,
  config: SimpleMarketplacePricingConfig
): void {
  listing.previousMarketplacePrice = listing.currentMarketplacePrice;

  if (listing.tcgMarketPrice && listing.tcgLowPrice) {
    listing.tcgMarketplacePrice = roundTo(
      Math.max(
        listing.tcgMarketPrice * config.percentage,
        listing.tcgLowPrice * config.percentage,
        config.floor
      ),
      2
    );
  } else if (listing.tcgMarketPrice) {
    listing.tcgMarketplacePrice = roundTo(
      Math.max(listing.tcgMarketPrice * config.percentage, config.floor),
      2
    );
  } else if (listing.tcgLowPrice) {
    listing.tcgMarketplacePrice = roundTo(
      Math.max(listing.tcgLowPrice * config.percentage, config.floor),
      2
    );
  }
  // else: keep current price
}

// ============================================================
// Postfilter: Only include items that actually changed
// ============================================================

export function postfilterListing(listing: Listing): boolean {
  return (
    listing.tcgMarketplacePrice !== listing.currentMarketplacePrice ||
    listing.addToQuantity > 0
  );
}

// ============================================================
// Summary calculation
// ============================================================

export function calculateListingSummary(
  listings: Listing[],
  skipped: number,
  errors: number
): ListingSummary {
  let currentTotalValue = 0;
  let newTotalValue = 0;
  let totalChangePercent = 0;
  let changeCount = 0;

  for (const l of listings) {
    const qty = (l.totalQuantity || 0) + (l.addToQuantity || 0);
    currentTotalValue += (l.currentMarketplacePrice || 0) * qty;
    newTotalValue += (l.tcgMarketplacePrice || 0) * qty;

    if (l.currentMarketplacePrice > 0) {
      totalChangePercent +=
        (l.tcgMarketplacePrice - l.currentMarketplacePrice) /
        l.currentMarketplacePrice;
      changeCount++;
    }
  }

  return {
    totalProcessed: listings.length + skipped,
    totalSkipped: skipped,
    totalChanged: listings.length,
    totalErrors: errors,
    currentTotalValue: roundTo(currentTotalValue, 2),
    newTotalValue: roundTo(newTotalValue, 2),
    valueDelta: roundTo(newTotalValue - currentTotalValue, 2),
    averageChangePercent: changeCount > 0 ? totalChangePercent / changeCount : 0,
  };
}
