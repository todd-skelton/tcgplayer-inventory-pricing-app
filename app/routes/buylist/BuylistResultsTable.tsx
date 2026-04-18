import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Tooltip,
  Stack,
} from "@mui/material";
import type { Buylisting } from "~/engine/types";
import {
  currencyFormatter,
  changeCurrencyFormatter,
  changePercentageFormatter,
} from "~/engine/formatters";

interface BuylistResultsTableProps {
  listings: Buylisting[];
}

export default function BuylistResultsTable({
  listings,
}: BuylistResultsTableProps) {
  if (listings.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">
          No buylist price changes to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto", minWidth: 0 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              Product
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              Set / Number
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              Rarity
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              Condition
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
              Market
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
              High
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
              Qty
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
              Current Price
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
              New Price
            </TableCell>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="center">
              Change
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {listings.map((listing) => {
            const delta = listing.myBuylistPrice - listing.currentBuylistPrice;
            const pct =
              listing.currentBuylistPrice !== 0
                ? delta / listing.currentBuylistPrice
                : 0;
            const deltaColor =
              delta > 0
                ? "success.main"
                : delta < 0
                ? "error.main"
                : "text.secondary";

            return (
              <TableRow
                key={listing.tcgPlayerId}
                sx={{ "&:hover": { bgcolor: "action.hover" } }}
              >
                <TableCell>
                  <Tooltip title={listing.productName} placement="top-start">
                    <Typography
                      variant="body2"
                      noWrap
                    >
                      {listing.productName}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Stack>
                    <Typography variant="body2" noWrap>
                      {listing.setName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {listing.number}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {listing.rarity}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{listing.condition}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {isNaN(listing.buylistMarketPrice)
                      ? "-"
                      : currencyFormatter.format(listing.buylistMarketPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {isNaN(listing.buylistHighPrice)
                      ? "-"
                      : currencyFormatter.format(listing.buylistHighPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {(listing.buylistQuantity || 0) +
                      (listing.addToBuylistQuantity || 0)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {currencyFormatter.format(listing.currentBuylistPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={deltaColor}>
                    {currencyFormatter.format(listing.myBuylistPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color={deltaColor}
                    >
                      {changeCurrencyFormatter.format(delta)}
                    </Typography>
                    <Typography variant="caption" color={deltaColor}>
                      ({changePercentageFormatter.format(pct)})
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
