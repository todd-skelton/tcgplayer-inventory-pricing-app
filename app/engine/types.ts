// ============================================================
// CSV Raw Types (column headers exactly as TCGPlayer exports)
// ============================================================

export interface TcgPlayerListingRaw {
  "TCGplayer Id": string;
  "Product Line": string;
  "Set Name": string;
  "Product Name": string;
  Title: string;
  Number: string;
  Rarity: string;
  Condition: string;
  "TCG Market Price": string;
  "TCG Direct Low": string;
  "TCG Low Price With Shipping": string;
  "TCG Low Price": string;
  "Total Quantity": string;
  "Add to Quantity": string;
  "TCG Marketplace Price": string;
  "Photo URL": string;
  [key: string]: string;
}

export interface TcgPlayerBuylistRaw {
  "TCGplayer Id": string;
  "Product Line": string;
  "Set Name": string;
  "Product Name": string;
  Number: string;
  Rarity: string;
  Condition: string;
  "Buylist Market Price": string;
  "Buylist High Price": string;
  "Buylist Quantity": string;
  "Add to Buylist Quantity": string;
  "My Buylist Price": string;
  "Pending Purchase Quantity": string;
  [key: string]: string;
}

// ============================================================
// Internal Processed Types
// ============================================================

export interface Listing {
  tcgPlayerId: string;
  productLine: string;
  setName: string;
  productName: string;
  title: string;
  number: string;
  rarity: string;
  condition: string;
  tcgMarketPrice: number;
  tcgDirectLow: number;
  tcgLowPriceWithShipping: number;
  tcgLowPrice: number;
  totalQuantity: number;
  addToQuantity: number;
  tcgMarketplacePrice: number;
  currentMarketplacePrice: number;
  photoUrl: string;
  previousMarketplacePrice?: number;
  error?: string;
  skippedReason?: string;
  raw: Record<string, string>;
}

export interface Buylisting {
  tcgPlayerId: string;
  productLine: string;
  setName: string;
  productName: string;
  number: string;
  rarity: string;
  condition: string;
  buylistMarketPrice: number;
  buylistHighPrice: number;
  buylistQuantity: number;
  addToBuylistQuantity: number;
  myBuylistPrice: number;
  currentBuylistPrice: number;
  pendingPurchaseQuantity: number;
  error?: string;
  raw: Record<string, string>;
}

// ============================================================
// Pricing Configuration Types
// ============================================================

export interface RarityFloor {
  rarity: string;
  floor: number;
}

export interface SetOverride {
  setPrefix: string;
  rarityFloors: RarityFloor[];
  defaultFloor: number;
}

export interface CardLock {
  number: string;
  rarity: string;
}

export interface MarketplacePricingConfig {
  // General
  allowedProductLine: string;
  maxPriceLock: number;
  skipTitledItems: boolean;
  requireBothPrices: boolean;

  // Default rarity floors
  defaultRarityFloor: number;
  rarityFloors: RarityFloor[];

  // Set-specific overrides
  setOverrides: SetOverride[];

  // Undercut settings
  undercutEnabled: boolean;
  undercutThreshold: number; // e.g. 0.90 = undercut when low >= 90% of market
  lowShippingAdjust: number; // shipping cost deducted from low+shipping for items < $5

  // Drop protection
  dropProtectionEnabled: boolean;
  dropProtectionSets: string[];
  dropProtectionThreshold: number; // e.g. 0.75 = don't drop below 75% of current

  // Excluded items
  excludedIds: string[];

  // Set locks – set names where prices won't change at all (no increases or decreases)
  lockedSets: string[];

  // Card locks – individual cards locked by number + rarity
  lockedCards: CardLock[];
}

export interface BuylistPricingConfig {
  percentage: number; // e.g. 0.85 = 85% of reference price
}

export interface SimpleMarketplacePricingConfig {
  floor: number; // e.g. 0.15
  percentage: number; // e.g. 1.15 = 115%
}

// ============================================================
// Processing Results
// ============================================================

export interface ListingSummary {
  totalProcessed: number;
  totalSkipped: number;
  totalChanged: number;
  totalErrors: number;
  currentTotalValue: number;
  newTotalValue: number;
  valueDelta: number;
  averageChangePercent: number;
}

export interface BuylistSummary {
  totalProcessed: number;
  totalSkipped: number;
  totalChanged: number;
  totalErrors: number;
  currentTotalValue: number;
  newTotalValue: number;
  valueDelta: number;
}

export type InventoryMode = "marketplace" | "marketplace-mystore" | "buylist";
