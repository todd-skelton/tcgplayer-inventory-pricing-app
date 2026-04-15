import type { Route } from "./+types/marketplace";
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
  Collapse,
  IconButton,
  TablePagination,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Papa from "papaparse";

import PageHeader from "~/components/PageHeader";
import FileUploadZone from "~/components/FileUploadZone";
import StatCard from "~/components/StatCard";
import { useLocalStorageState } from "~/hooks/useLocalStorageState";
import { DEFAULT_MARKETPLACE_CONFIG } from "~/engine/defaults";
import {
  parseListingRow,
  serializeListingRow,
  prefilterListing,
  calculateMarketplacePrice,
  postfilterListing,
  calculateListingSummary,
} from "~/engine/marketplace-engine";
import {
  currencyFormatter,
  changeCurrencyFormatter,
  changePercentageFormatter,
  quantityFormatter,
} from "~/engine/formatters";
import type {
  MarketplacePricingConfig,
  TcgPlayerListingRaw,
  Listing,
  ListingSummary,
} from "~/engine/types";
import MarketplaceSettingsPanel from "./MarketplaceSettingsPanel";
import MarketplaceResultsTable from "./MarketplaceResultsTable";

import InventoryIcon from "@mui/icons-material/Inventory";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ErrorIcon from "@mui/icons-material/Error";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Marketplace Pricing - TCG Price Manager" },
    {
      name: "description",
      content: "Update your TCGPlayer marketplace listing prices.",
    },
  ];
}

const STEPS = ["Upload CSV", "Review Settings", "Preview & Download"];

export default function MarketplacePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useLocalStorageState<MarketplacePricingConfig>(
    "marketplace_config",
    DEFAULT_MARKETPLACE_CONFIG
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [summary, setSummary] = useState<ListingSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useLocalStorageState(
    "marketplace_rowsPerPage",
    250
  );

  const processFile = useCallback(
    (file: File) => {
      setProcessing(true);
      const results: Listing[] = [];
      let skipped = 0;
      let errors = 0;

      Papa.parse<TcgPlayerListingRaw>(file, {
        header: true,
        skipEmptyLines: true,
        step: (row) => {
          try {
            const listing = parseListingRow(row.data);
            const filter = prefilterListing(listing, config);
            if (!filter.pass) {
              skipped++;
              return;
            }
            calculateMarketplacePrice(listing, config);
            if (listing.skippedReason) {
              skipped++;
              return;
            }
            if (!postfilterListing(listing)) {
              skipped++;
              return;
            }
            results.push(listing);
          } catch (err) {
            errors++;
            console.error("Row processing error:", err);
          }
        },
        complete: () => {
          setListings(results);
          setSummary(calculateListingSummary(results, skipped, errors));
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
    [config]
  );

  const handleDownload = useCallback(() => {
    const rows = listings.map(serializeListingRow);
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tcgplayer_marketplace_update_${new Date()
      .toISOString()
      .replace(/[:T-]/g, ".")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [listings]);

  const handleReset = useCallback(() => {
    setListings([]);
    setSummary(null);
    setActiveStep(0);
    setPage(0);
  }, []);

  const pagedListings = useMemo(
    () => listings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [listings, page, rowsPerPage]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Marketplace Pricing"
        description="Upload your TCGPlayer inventory export and get optimized marketplace prices."
        icon={<StorefrontIcon />}
        action={
          listings.length > 0 ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                size="large"
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

      {/* Stepper */}
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
              setActiveStep(1);
              processFile(file);
            }}
            description="Upload your TCGPlayer Inventory Export (.csv)"
            disabled={processing}
          />
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              <strong>How to export:</strong> Log into TCGPlayer Seller Portal,
              go to Inventory {">"} Manage Pricing, click "Export" to download
              your inventory as a CSV file.
            </Typography>
          </Alert>
        </Stack>
      )}

      {/* Step 2: Processing / Settings */}
      {activeStep === 1 && processing && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" gutterBottom>
            Processing your inventory...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Calculating optimized prices for each item
          </Typography>
        </Box>
      )}

      {/* Step 3: Results */}
      {activeStep === 2 && summary && (
        <Stack spacing={3}>
          {/* Summary Stats */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
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
              label="Value Change"
              value={changeCurrencyFormatter.format(summary.valueDelta)}
              icon={<AttachMoneyIcon fontSize="small" />}
              delta={summary.valueDelta}
              subtitle={`${currencyFormatter.format(summary.currentTotalValue)} \u2192 ${currencyFormatter.format(summary.newTotalValue)}`}
            />
            <StatCard
              label="Avg. Change"
              value={changePercentageFormatter.format(
                summary.averageChangePercent
              )}
              icon={<TrendingUpIcon fontSize="small" />}
              delta={summary.averageChangePercent}
            />
            {summary.totalErrors > 0 && (
              <StatCard
                label="Errors"
                value={summary.totalErrors.toString()}
                icon={<ErrorIcon fontSize="small" />}
              />
            )}
          </Stack>

          {/* Settings Toggle */}
          <Box>
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              endIcon={settingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setSettingsOpen(!settingsOpen)}
              size="small"
            >
              {settingsOpen ? "Hide" : "Show"} Pricing Settings
            </Button>
            <Collapse in={settingsOpen}>
              <Box sx={{ mt: 2 }}>
                <MarketplaceSettingsPanel
                  config={config}
                  onChange={(newConfig) => {
                    setConfig(newConfig);
                  }}
                />
                <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
                  Settings changes will apply the next time you process a file.
                </Alert>
              </Box>
            </Collapse>
          </Box>

          {/* Download bar */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "success.main",
              color: "success.contrastText",
            }}
          >
            <DownloadIcon />
            <Typography variant="body1" fontWeight={600} sx={{ flexGrow: 1 }}>
              {quantityFormatter.format(listings.length)} items ready for download
            </Typography>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ color: "success.main", bgcolor: "white" }}
            >
              Download CSV
            </Button>
          </Stack>

          {/* Results Table */}
          <MarketplaceResultsTable listings={pagedListings} />

          {listings.length > rowsPerPage && (
            <TablePagination
              component="div"
              rowsPerPageOptions={[100, 250, 500, 1000]}
              count={listings.length}
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
