import type {
  TcgPlayerBuylistRaw,
  Buylisting,
  BuylistPricingConfig,
  BuylistSummary,
} from "./types";
import { roundTo } from "./formatters";

// ============================================================
// CSV <-> Internal Mapping
// ============================================================

export function parseBuylistRow(raw: TcgPlayerBuylistRaw): Buylisting {
  const {
    "TCGplayer Id": tcgPlayerId,
    "Product Line": productLine,
    "Set Name": setName,
    "Product Name": productName,
    Number: number,
    Rarity: rarity,
    Condition: condition,
    "Buylist Market Price": buylistMarketPrice,
    "Buylist High Price": buylistHighPrice,
    "Buylist Quantity": buylistQuantity,
    "Add to Buylist Quantity": addToBuylistQuantity,
    "My Buylist Price": myBuylistPrice,
    "Pending Purchase Quantity": pendingPurchaseQuantity,
    ...extra
  } = raw;

  return {
    tcgPlayerId,
    productLine,
    setName,
    productName,
    number,
    rarity,
    condition,
    buylistMarketPrice: parseFloat(buylistMarketPrice),
    buylistHighPrice: parseFloat(buylistHighPrice),
    buylistQuantity: parseInt(buylistQuantity, 10),
    addToBuylistQuantity: parseInt(addToBuylistQuantity, 10),
    myBuylistPrice: parseFloat(myBuylistPrice),
    currentBuylistPrice: parseFloat(myBuylistPrice),
    pendingPurchaseQuantity: parseInt(pendingPurchaseQuantity, 10),
    raw: extra,
  };
}

export function serializeBuylistRow(
  buylisting: Buylisting
): TcgPlayerBuylistRaw {
  return {
    "TCGplayer Id": buylisting.tcgPlayerId,
    "Product Line": buylisting.productLine,
    "Set Name": buylisting.setName,
    "Product Name": buylisting.productName,
    Number: buylisting.number,
    Rarity: buylisting.rarity,
    Condition: buylisting.condition,
    "Buylist Market Price": isNaN(buylisting.buylistMarketPrice)
      ? ""
      : buylisting.buylistMarketPrice.toFixed(2),
    "Buylist High Price": isNaN(buylisting.buylistHighPrice)
      ? ""
      : buylisting.buylistHighPrice.toFixed(2),
    "Buylist Quantity": isNaN(buylisting.buylistQuantity)
      ? ""
      : buylisting.buylistQuantity.toFixed(0),
    "Add to Buylist Quantity": isNaN(buylisting.addToBuylistQuantity)
      ? ""
      : buylisting.addToBuylistQuantity.toFixed(0),
    "My Buylist Price": isNaN(buylisting.myBuylistPrice)
      ? ""
      : buylisting.myBuylistPrice.toFixed(2),
    "Pending Purchase Quantity": isNaN(buylisting.pendingPurchaseQuantity)
      ? ""
      : buylisting.pendingPurchaseQuantity.toFixed(0),
    ...buylisting.raw,
  };
}

// ============================================================
// Prefilter
// ============================================================

export function prefilterBuylisting(buylisting: Buylisting): boolean {
  return buylisting.addToBuylistQuantity > 0 || buylisting.buylistQuantity > 0;
}

// ============================================================
// Pricing Logic
// ============================================================

export function calculateBuylistPrice(
  buylisting: Buylisting,
  config: BuylistPricingConfig
): void {
  const { buylistMarketPrice, buylistHighPrice } = buylisting;

  if (buylistMarketPrice && buylistHighPrice) {
    buylisting.myBuylistPrice = roundTo(
      Math.min(
        buylistMarketPrice * config.percentage,
        buylistHighPrice * config.percentage
      ),
      2
    );
  } else if (buylistMarketPrice) {
    buylisting.myBuylistPrice = roundTo(
      buylistMarketPrice * config.percentage,
      2
    );
  } else if (buylistHighPrice) {
    buylisting.myBuylistPrice = roundTo(
      buylistHighPrice * config.percentage,
      2
    );
  }
  // else: keep current price
}

// ============================================================
// Postfilter
// ============================================================

export function postfilterBuylisting(buylisting: Buylisting): boolean {
  return buylisting.myBuylistPrice !== buylisting.currentBuylistPrice;
}

// ============================================================
// Summary
// ============================================================

export function calculateBuylistSummary(
  listings: Buylisting[],
  skipped: number,
  errors: number
): BuylistSummary {
  let currentTotalValue = 0;
  let newTotalValue = 0;

  for (const b of listings) {
    const qty = (b.buylistQuantity || 0) + (b.addToBuylistQuantity || 0);
    currentTotalValue += (b.currentBuylistPrice || 0) * qty;
    newTotalValue += (b.myBuylistPrice || 0) * qty;
  }

  return {
    totalProcessed: listings.length + skipped,
    totalSkipped: skipped,
    totalChanged: listings.length,
    totalErrors: errors,
    currentTotalValue: roundTo(currentTotalValue, 2),
    newTotalValue: roundTo(newTotalValue, 2),
    valueDelta: roundTo(newTotalValue - currentTotalValue, 2),
  };
}
