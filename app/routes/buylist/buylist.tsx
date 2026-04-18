import type { Route } from "./+types/buylist";
import { useState, useCallback, useMemo } from "react";
import {
  Container,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  Alert,
  TablePagination,
  TextField,
  InputAdornment,
  Paper,
  Tooltip,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InventoryIcon from "@mui/icons-material/Inventory";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import Papa from "papaparse";

import PageHeader from "~/components/PageHeader";
import FileUploadZone from "~/components/FileUploadZone";
import StatCard from "~/components/StatCard";
import ResultsFilterBar, {
  type FilterState,
  EMPTY_FILTERS,
} from "~/components/ResultsFilterBar";
import { useLocalStorageState } from "~/hooks/useLocalStorageState";
import { DEFAULT_BUYLIST_CONFIG } from "~/engine/defaults";
import {
  parseBuylistRow,
  serializeBuylistRow,
  prefilterBuylisting,
  calculateBuylistPrice,
  postfilterBuylisting,
  calculateBuylistSummary,
} from "~/engine/buylist-engine";
import {
  currencyFormatter,
  changeCurrencyFormatter,
  changePercentageFormatter,
  quantityFormatter,
} from "~/engine/formatters";
import type {
  BuylistPricingConfig,
  TcgPlayerBuylistRaw,
  Buylisting,
  BuylistSummary,
} from "~/engine/types";
import BuylistResultsTable from "./BuylistResultsTable";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Buylist Pricing - TCG Price Manager" },
    {
      name: "description",
      content: "Update your TCGPlayer buylist prices.",
    },
  ];
}

const STEPS = ["Upload CSV", "Set Percentage", "Preview & Download"];

export default function BuylistPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useLocalStorageState<BuylistPricingConfig>(
    "buylist_config",
    DEFAULT_BUYLIST_CONFIG
  );
  const [listings, setListings] = useState<Buylisting[]>([]);
  const [summary, setSummary] = useState<BuylistSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useLocalStorageState(
    "buylist_rowsPerPage",
    250
  );
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const processFile = useCallback(
    (file: File, cfg: BuylistPricingConfig) => {
      setProcessing(true);
      const results: Buylisting[] = [];
      let skipped = 0;
      let errors = 0;

      Papa.parse<TcgPlayerBuylistRaw>(file, {
        header: true,
        skipEmptyLines: true,
        step: (row) => {
          try {
            const buylisting = parseBuylistRow(row.data);
            if (!prefilterBuylisting(buylisting)) {
              skipped++;
              return;
            }
            calculateBuylistPrice(buylisting, cfg);
            if (!postfilterBuylisting(buylisting)) {
              skipped++;
              return;
            }
            results.push(buylisting);
          } catch (err) {
            errors++;
            console.error("Row processing error:", err);
          }
        },
        complete: () => {
          setListings(results);
          setSummary(calculateBuylistSummary(results, skipped, errors));
          setProcessing(false);
          setActiveStep(2);
          setPage(0);
        },
        error: (err) => {
          console.error("CSV parse error:", err);
          setProcessing(false);
        },
      });
    },
    []
  );

  const handleDownload = useCallback(() => {
    const rows = listings.map(serializeBuylistRow);
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tcgplayer_buylist_update_${new Date()
      .toISOString()
      .replace(/[:T-]/g, ".")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [listings]);

  const handleReset = useCallback(() => {
    setListings([]);
    setSummary(null);
    setPendingFile(null);
    setActiveStep(0);
    setPage(0);
    setFilters(EMPTY_FILTERS);
  }, []);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const filterOptions = useMemo(
    () => ({
      sets: [...new Set(listings.map((l) => l.setName))].sort(),
      rarities: [...new Set(listings.map((l) => l.rarity))].sort(),
      conditions: [...new Set(listings.map((l) => l.condition))].sort(),
    }),
    [listings]
  );

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !listing.productName.toLowerCase().includes(q) &&
          !listing.setName.toLowerCase().includes(q) &&
          !listing.number.toLowerCase().includes(q) &&
          !listing.rarity.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.sets.length > 0 && !filters.sets.includes(listing.setName))
        return false;
      if (
        filters.rarities.length > 0 &&
        !filters.rarities.includes(listing.rarity)
      )
        return false;
      if (
        filters.conditions.length > 0 &&
        !filters.conditions.includes(listing.condition)
      )
        return false;
      if (filters.changeDirection !== "all") {
        const delta = listing.myBuylistPrice - listing.currentBuylistPrice;
        if (filters.changeDirection === "up" && delta <= 0) return false;
        if (filters.changeDirection === "down" && delta >= 0) return false;
      }
      return true;
    });
  }, [listings, filters]);

  const pagedListings = useMemo(
    () =>
      filteredListings.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredListings, page, rowsPerPage]
  );

  return (
    <Container maxWidth={false} sx={{ overflow: "hidden" }}>
      <PageHeader
        title="Buylist Pricing"
        description="Update your buylist prices based on market data to attract sellers at the right margins."
        icon={<ShoppingCartIcon />}
        action={
          listings.length > 0 ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                size="large"
                color="secondary"
              >
                Download Updated CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
              >
                Start Over
              </Button>
            </Stack>
          ) : undefined
        }
      />

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Upload */}
      {activeStep === 0 && (
        <Stack spacing={3}>
          <FileUploadZone
            onFileSelect={(file) => {
              setPendingFile(file);
              setActiveStep(1);
            }}
            description="Upload your TCGPlayer Buylist Export (.csv)"
            disabled={processing}
          />
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              <strong>How to export:</strong> Log into TCGPlayer Seller Portal,
              go to Buying {">"} Buylist Settings, click "Export" to download
              your buylist as a CSV file.
            </Typography>
          </Alert>
        </Stack>
      )}

      {/* Step 2: Configure */}
      {activeStep === 1 && (
        <Stack spacing={3} sx={{ maxWidth: 500, mx: "auto" }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Buylist Price Percentage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set the percentage of the market/high price you want to offer.
                Lower percentages mean better margins but fewer sellers.
              </Typography>
              <TextField
                label="Buy at % of reference price"
                type="number"
                value={Math.round(config.percentage * 100)}
                onChange={(e) =>
                  setConfig({
                    percentage: (parseFloat(e.target.value) || 0) / 100,
                  })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
                helperText={`Buying at ${Math.round(config.percentage * 100)}% means a $10 market card would have a buylist price of ${currencyFormatter.format(10 * config.percentage)}`}
                fullWidth
              />
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  For each card, the tool calculates{" "}
                  <strong>{Math.round(config.percentage * 100)}%</strong> of both
                  the Buylist Market Price and Buylist High Price, then uses the{" "}
                  <strong>lower</strong> of the two as your offer.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                disabled={processing}
                onClick={() => {
                  if (pendingFile) {
                    processFile(pendingFile, config);
                  }
                }}
              >
                {processing ? "Processing..." : "Calculate Prices"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* Step 3: Results */}
      {activeStep === 2 && summary && (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <StatCard
              label="Items Processed"
              value={quantityFormatter.format(summary.totalProcessed)}
              icon={<InventoryIcon fontSize="small" />}
              subtitle={`${quantityFormatter.format(summary.totalChanged)} with price changes`}
            />
            <StatCard
              label="Items Updated"
              value={quantityFormatter.format(summary.totalChanged)}
              icon={<SwapHorizIcon fontSize="small" />}
              subtitle={`${quantityFormatter.format(summary.totalSkipped)} skipped`}
            />
            <StatCard
              label="Buylist Value Change"
              value={changeCurrencyFormatter.format(summary.valueDelta)}
              icon={<AttachMoneyIcon fontSize="small" />}
              delta={summary.valueDelta}
              subtitle={`${currencyFormatter.format(summary.currentTotalValue)} \u2192 ${currencyFormatter.format(summary.newTotalValue)}`}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
            }}
          >
            <DownloadIcon />
            <Typography variant="body1" fontWeight={600} sx={{ flexGrow: 1 }}>
              {quantityFormatter.format(listings.length)} buylist items ready
              for download
            </Typography>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ color: "secondary.main", bgcolor: "white" }}
            >
              Download CSV
            </Button>
          </Stack>

          {/* Search & Filter */}
          <ResultsFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableSets={filterOptions.sets}
            availableRarities={filterOptions.rarities}
            availableConditions={filterOptions.conditions}
            totalCount={listings.length}
            filteredCount={filteredListings.length}
          />

          <BuylistResultsTable listings={pagedListings} />

          {filteredListings.length > rowsPerPage && (
            <TablePagination
              component="div"
              rowsPerPageOptions={[100, 250, 500, 1000]}
              count={filteredListings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          )}
        </Stack>
      )}
    </Container>
  );
}
