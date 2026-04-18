import { useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Typography,
  Box,
  Tooltip,
  Stack,
  IconButton,
  TextField,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import type { Listing, CardLock, LockMode } from "~/engine/types";
import {
  currencyFormatter,
  changeCurrencyFormatter,
  changePercentageFormatter,
} from "~/engine/formatters";

export type SortKey =
  | "productName"
  | "setName"
  | "rarity"
  | "condition"
  | "tcgMarketPrice"
  | "tcgLowPrice"
  | "tcgLowPriceWithShipping"
  | "quantity"
  | "currentMarketplacePrice"
  | "tcgMarketplacePrice"
  | "change";

export type SortDirection = "asc" | "desc";

interface MarketplaceResultsTableProps {
  listings: Listing[];
  lockedSets: string[];
  lockedCards: CardLock[];
  lockMode: LockMode;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onPriceChange: (tcgPlayerId: string, newPrice: number) => void;
  onToggleSetLock: (setName: string) => void;
  onToggleCardLock: (number: string, rarity: string) => void;
}

function checkSetLocked(setName: string, lockedSets: string[]): boolean {
  return lockedSets.includes(setName);
}

function checkCardLocked(
  number: string,
  rarity: string,
  lockedCards: CardLock[]
): boolean {
  return lockedCards.some(
    (c) => c.number === number && c.rarity === rarity
  );
}

const baseCellSx = {
  px: { xs: 0.75, sm: 1, md: 1.25 },
  py: 0.75,
  verticalAlign: "top",
} as const;

const headerSx = {
  ...baseCellSx,
  fontWeight: 700,
  whiteSpace: "nowrap",
  bgcolor: "background.paper",
} as const;

const columnSx = {
  product: { width: { xs: 180, md: 220, lg: 260 } },
  set: { width: { xs: 150, md: 185, lg: 210 } },
  rarity: { width: { xs: 92, lg: 112 } },
  condition: { width: { xs: 90, lg: 110 } },
  market: { width: { xs: 78, lg: 94 } },
  low: { width: { xs: 78, lg: 94 } },
  lowShipping: { width: { xs: 92, lg: 108 } },
  quantity: { width: 54 },
  currentPrice: { width: { xs: 90, lg: 108 } },
  newPrice: { width: { xs: 94, lg: 112 } },
  change: { width: { xs: 108, lg: 124 } },
  actions: { width: 64, minWidth: 64 },
} as const;

const truncatedTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const numericCellSx = { whiteSpace: "nowrap" } as const;

const stickyActionSx = {
  position: "sticky",
  right: 0,
  boxShadow: "inset 1px 0 0 rgba(0, 0, 0, 0.12)",
} as const;

export default function MarketplaceResultsTable({
  listings,
  lockedSets,
  lockedCards,
  lockMode,
  sortKey,
  sortDirection,
  onSort,
  onPriceChange,
  onToggleSetLock,
  onToggleCardLock,
}: MarketplaceResultsTableProps) {
  if (listings.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">
          No price changes to display
        </Typography>
      </Box>
    );
  }

  const sortableHeader = (
    label: string,
    key: SortKey,
    align?: "left" | "right" | "center",
    sx?: object
  ) => (
    <TableCell sx={sx ? { ...headerSx, ...sx } : headerSx} align={align}>
      <TableSortLabel
        active={sortKey === key}
        direction={sortKey === key ? sortDirection : "asc"}
        onClick={() => onSort(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ overflowX: "auto", minWidth: 0 }}>
      <Table
        size="small"
        stickyHeader
        sx={{
          width: "100%",
          tableLayout: "fixed",
          minWidth: 0,
        }}
      >
        <TableHead>
          <TableRow>
            {sortableHeader("Product", "productName", undefined, columnSx.product)}
            {sortableHeader("Set / Number", "setName", undefined, columnSx.set)}
            {sortableHeader("Rarity", "rarity", undefined, columnSx.rarity)}
            {sortableHeader("Condition", "condition", undefined, columnSx.condition)}
            {sortableHeader("Market", "tcgMarketPrice", "right", columnSx.market)}
            {sortableHeader("Low", "tcgLowPrice", "right", columnSx.low)}
            {sortableHeader(
              "Low + Ship",
              "tcgLowPriceWithShipping",
              "right",
              columnSx.lowShipping
            )}
            {sortableHeader("Qty", "quantity", "right", columnSx.quantity)}
            {sortableHeader(
              "Current Price",
              "currentMarketplacePrice",
              "right",
              columnSx.currentPrice
            )}
            {sortableHeader(
              "New Price",
              "tcgMarketplacePrice",
              "right",
              columnSx.newPrice
            )}
            {sortableHeader("Change", "change", "center", columnSx.change)}
            <TableCell
              sx={[headerSx, columnSx.actions, stickyActionSx, { zIndex: 4 }]}
              align="center"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listings.map((listing) => (
            <ResultRow
              key={listing.tcgPlayerId}
              listing={listing}
              setLocked={checkSetLocked(listing.setName, lockedSets)}
              cardLocked={checkCardLocked(listing.number, listing.rarity, lockedCards)}
              lockMode={lockMode}
              onPriceChange={onPriceChange}
              onToggleSetLock={onToggleSetLock}
              onToggleCardLock={onToggleCardLock}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function ResultRow({
  listing,
  setLocked,
  cardLocked,
  lockMode,
  onPriceChange,
  onToggleSetLock,
  onToggleCardLock,
}: {
  listing: Listing;
  setLocked: boolean;
  cardLocked: boolean;
  lockMode: LockMode;
  onPriceChange: (tcgPlayerId: string, newPrice: number) => void;
  onToggleSetLock: (setName: string) => void;
  onToggleCardLock: (number: string, rarity: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const locked = setLocked || cardLocked;
  const rowBg = locked ? "action.selected" : "background.paper";

  const delta =
    listing.tcgMarketplacePrice - listing.currentMarketplacePrice;
  const pct =
    listing.currentMarketplacePrice !== 0
      ? delta / listing.currentMarketplacePrice
      : 0;
  const deltaColor =
    delta > 0
      ? "success.main"
      : delta < 0
      ? "error.main"
      : "text.secondary";

  const startEditing = () => {
    setEditValue(listing.tcgMarketplacePrice.toFixed(2));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onPriceChange(listing.tcgPlayerId, Math.round(parsed * 100) / 100);
    }
    setEditing(false);
  };

  return (
    <TableRow
      sx={{
        "&:hover": { bgcolor: "action.hover" },
        "& .sticky-action-cell": { bgcolor: rowBg },
        "&:hover .sticky-action-cell": { bgcolor: "action.hover" },
        ...(locked && {
          bgcolor: "action.selected",
          borderLeft: "3px solid",
          borderLeftColor: setLocked ? "warning.main" : "primary.main",
        }),
      }}
    >
      <TableCell sx={columnSx.product}>
        <Tooltip title={listing.productName} placement="top-start">
          <Typography
            variant="body2"
            noWrap
            sx={truncatedTextSx}
          >
            {listing.productName}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell sx={columnSx.set}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={truncatedTextSx}>
              {listing.setName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={truncatedTextSx}
            >
              {listing.number}
            </Typography>
          </Stack>
          <Tooltip title={setLocked ? "Unlock set" : `Lock set (${lockMode === "partial" ? "blocks decreases only" : "blocks all price changes"})`}>
            <IconButton
              size="small"
              color={setLocked ? "warning" : "default"}
              onClick={() => onToggleSetLock(listing.setName)}
              sx={{
                ml: 0.25,
                p: 0.25,
                opacity: setLocked ? 1 : 0.4,
                "&:hover": { opacity: 1 },
              }}
            >
              {setLocked ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
      <TableCell sx={columnSx.rarity}>
        <Typography variant="body2" noWrap sx={truncatedTextSx}>
          {listing.rarity}
        </Typography>
      </TableCell>
      <TableCell sx={columnSx.condition}>
        <Typography variant="body2" noWrap sx={truncatedTextSx}>
          {listing.condition}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.market, numericCellSx]}>
        <Typography variant="body2">
          {isNaN(listing.tcgMarketPrice)
            ? "-"
            : currencyFormatter.format(listing.tcgMarketPrice)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.low, numericCellSx]}>
        <Typography variant="body2">
          {isNaN(listing.tcgLowPrice)
            ? "-"
            : currencyFormatter.format(listing.tcgLowPrice)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.lowShipping, numericCellSx]}>
        <Typography variant="body2">
          {isNaN(listing.tcgLowPriceWithShipping)
            ? "-"
            : currencyFormatter.format(
                listing.tcgLowPriceWithShipping
              )}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.quantity, numericCellSx]}>
        <Typography variant="body2">
          {(listing.totalQuantity || 0) +
            (listing.addToQuantity || 0)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.currentPrice, numericCellSx]}>
        <Typography variant="body2">
          {currencyFormatter.format(listing.currentMarketplacePrice)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={[columnSx.newPrice, numericCellSx]}>
        {editing ? (
          <TextField
            size="small"
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            slotProps={{
              input: {
                sx: {
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  py: 0,
                  "& input": { textAlign: "right", p: "4px 8px", width: 64 },
                },
              },
            }}
          />
        ) : (
          <Tooltip title="Click to edit" placement="top">
            <Typography
              variant="body2"
              fontWeight={700}
              color={deltaColor}
              onClick={startEditing}
              sx={{
                cursor: "pointer",
                borderBottom: "1px dashed",
                borderColor: "divider",
                display: "inline-block",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              {currencyFormatter.format(listing.tcgMarketplacePrice)}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell align="center" sx={columnSx.change}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: 0, lg: 0.5 }}
          justifyContent="center"
          alignItems="center"
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color={deltaColor}
          >
            {changeCurrencyFormatter.format(delta)}
          </Typography>
          <Typography
            variant="caption"
            color={deltaColor}
          >
            ({changePercentageFormatter.format(pct)})
          </Typography>
        </Stack>
      </TableCell>
      <TableCell
        align="center"
        className="sticky-action-cell"
        sx={[columnSx.actions, stickyActionSx, { zIndex: 2 }]}
      >
        <Tooltip title={cardLocked ? "Unlock card" : `Lock card (${lockMode === "partial" ? "blocks decreases only" : "blocks all price changes"})`}>
          <IconButton
            size="small"
            color={cardLocked ? "primary" : "default"}
            onClick={() =>
              onToggleCardLock(listing.number, listing.rarity)
            }
            sx={{ p: 0.5 }}
          >
            {cardLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
