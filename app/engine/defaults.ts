import type {
  MarketplacePricingConfig,
  BuylistPricingConfig,
  SimpleMarketplacePricingConfig,
} from "./types";

export const DEFAULT_MARKETPLACE_CONFIG: MarketplacePricingConfig = {
  allowedProductLine: "YuGiOh",
  maxPriceLock: 38,
  skipTitledItems: true,
  requireBothPrices: true,

  defaultRarityFloor: 2,
  rarityFloors: [
    { rarity: "Common", floor: 1 },
    { rarity: "Rare", floor: 1 },
    { rarity: "Mosaic Rare", floor: 1 },
    { rarity: "Shatterfoil Rare", floor: 1 },
    { rarity: "Starfoil Rare", floor: 1 },
    { rarity: "Quarter Century Secret Rare", floor: 2 },
    { rarity: "Starlight Rare", floor: 2 },
  ],

  setOverrides: [
    {
      setPrefix: "RA0",
      defaultFloor: 1,
      rarityFloors: [
        { rarity: "Super Rare", floor: 0.5 },
        { rarity: "Ultra Rare", floor: 0.5 },
        { rarity: "Secret Rare", floor: 0.75 },
        { rarity: "Prismatic Ultimate Rare", floor: 0.75 },
        { rarity: "Prismatic Collector's Rare", floor: 0.75 },
        { rarity: "Platinum Secret Rare", floor: 2 },
        { rarity: "Quarter Century Secret Rare", floor: 2 },
      ],
    },
    {
      setPrefix: "DT0",
      defaultFloor: 2.5,
      rarityFloors: [],
    },
  ],

  undercutEnabled: true,
  undercutThreshold: 0.9,
  lowShippingAdjust: 1.31,

  dropProtectionEnabled: true,
  dropProtectionSets: ["RA0", "DT0"],
  dropProtectionThreshold: 0.75,

  lockedSets: [],
  lockedCards: [],
  lockMode: "full",

  excludedIds: [
    "7933574", "7933575", "7916036", "7916037", "7916046", "7916047",
    "7916041", "7916042", "7933594", "7933595", "7933589", "7933590",
    "4346203", "4346204", "7512830", "7512831", "7512845", "7512848",
    "7512835", "7512836", "8670364", "8670365", "8670359", "8670374",
    "8670375", "8671584", "8671585", "8671579", "8671594", "8671595",
    "8670934", "8670935", "8670919", "8670921", "8670924", "8670939",
    "8670940", "8670929", "8670944", "8670945", "412269", "571262",
    "412395", "538406", "572588", "8961399", "8961400", "8961384",
    "8961385", "8961374", "8961375", "8985809", "8985784", "8985819",
    "8985854", "8985869", "8985810", "8985855", "8985870", "8985785",
    "8985820", "8985604", "8985619", "8985709", "8985605", "8985620",
    "8985710", "8985494", "8985499", "8985434", "8985514", "8985539",
    "8985469", "8985439", "8985495", "8985500", "8985435", "8985504",
    "8985515", "8985845", "8985645", "8985445", "8985470", "8985504",
    "8985505", "8985844", "8985845", "8985644", "8985645", "8985444",
    "8985445",
  ],
};

export const DEFAULT_SIMPLE_MARKETPLACE_CONFIG: SimpleMarketplacePricingConfig = {
  floor: 0.15,
  percentage: 1.15,
};

export const DEFAULT_BUYLIST_CONFIG: BuylistPricingConfig = {
  percentage: 0.85,
};
