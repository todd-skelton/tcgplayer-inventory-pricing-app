import type { Route } from "./+types/settings";
import { useState, useCallback } from "react";
import {
  Container,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import RestoreIcon from "@mui/icons-material/Restore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LockIcon from "@mui/icons-material/Lock";

import PageHeader from "~/components/PageHeader";
import { useLocalStorageState } from "~/hooks/useLocalStorageState";
import {
  DEFAULT_MARKETPLACE_CONFIG,
  DEFAULT_BUYLIST_CONFIG,
} from "~/engine/defaults";
import { currencyFormatter } from "~/engine/formatters";
import type {
  MarketplacePricingConfig,
  CardLock,
  LockMode,
  BuylistPricingConfig,
} from "~/engine/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - TCG Price Manager" },
    {
      name: "description",
      content: "Configure your pricing rules and preferences.",
    },
  ];
}

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [config, setConfig] = useLocalStorageState<MarketplacePricingConfig>(
    "marketplace_config",
    DEFAULT_MARKETPLACE_CONFIG
  );
  const [buylistConfig, setBuylistConfig] =
    useLocalStorageState<BuylistPricingConfig>(
      "buylist_config",
      DEFAULT_BUYLIST_CONFIG
    );
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleExport = useCallback(() => {
    const data = {
      marketplace_config: config,
      buylist_config: buylistConfig,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tcg-price-manager-settings-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [config, buylistConfig]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.marketplace_config) {
            setConfig(data.marketplace_config);
          }
          if (data.buylist_config) {
            setBuylistConfig(data.buylist_config);
          }
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } catch {
          console.error("Failed to import settings");
        }
      };
      reader.readAsText(file);
    },
    [setConfig, setBuylistConfig]
  );

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_MARKETPLACE_CONFIG);
    setBuylistConfig(DEFAULT_BUYLIST_CONFIG);
    setResetDialogOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [setConfig, setBuylistConfig]);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Settings"
        description="Configure your pricing rules, excluded items, and preferences."
        icon={<SettingsIcon />}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleExport}
            >
              Export Settings
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Import Settings
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImport}
              />
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestoreIcon />}
              onClick={() => setResetDialogOpen(true)}
            >
              Reset to Defaults
            </Button>
          </Stack>
        }
      />

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Excluded Items" />
        <Tab label="Rarity Floors" />
        <Tab label="Pricing Rules" />
        <Tab label="Price Locks" />
        <Tab label="Buylist" />
      </Tabs>

      {/* Tab 0: Excluded Items */}
      {tab === 0 && (
        <ExcludedItemsTab
          excludedIds={config.excludedIds}
          onChange={(ids) => setConfig({ ...config, excludedIds: ids })}
        />
      )}

      {/* Tab 1: Rarity Floors */}
      {tab === 1 && (
        <RarityFloorsTab
          config={config}
          onChange={(updated) => setConfig(updated)}
        />
      )}

      {/* Tab 2: Pricing Rules */}
      {tab === 2 && (
        <PricingRulesTab
          config={config}
          onChange={(updated) => setConfig(updated)}
        />
      )}

      {/* Tab 3: Price Locks */}
      {tab === 3 && (
        <PriceLocksTab
          lockedSets={config.lockedSets ?? []}
          lockedCards={config.lockedCards ?? []}
          lockMode={config.lockMode ?? "full"}
          onLockedSetsChange={(lockedSets) =>
            setConfig({ ...config, lockedSets })
          }
          onLockedCardsChange={(lockedCards) =>
            setConfig({ ...config, lockedCards })
          }
          onLockModeChange={(lockMode) =>
            setConfig({ ...config, lockMode })
          }
        />
      )}

      {/* Tab 4: Buylist */}
      {tab === 4 && (
        <BuylistTab
          config={buylistConfig}
          onChange={(updated) => setBuylistConfig(updated)}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Reset All Settings?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will restore all settings to their default values. This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Reset Everything
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// ============================================================
// Excluded Items Tab
// ============================================================

function ExcludedItemsTab({
  excludedIds,
  onChange,
}: {
  excludedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [newId, setNewId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const addId = (id: string) => {
    const trimmed = id.trim();
    if (trimmed && !excludedIds.includes(trimmed)) {
      onChange([...excludedIds, trimmed]);
    }
  };

  const addBulk = () => {
    const ids = bulkInput
      .split(/[,\n\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && !excludedIds.includes(s));
    if (ids.length > 0) {
      onChange([...excludedIds, ...ids]);
      setBulkInput("");
      setShowBulk(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Excluded Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Items with these TCGPlayer IDs will be skipped during price
            processing. Use this for items you don't want to reprice
            automatically.
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> Say you have a Blue-Eyes White Dragon (TCGPlayer ID: 575643) that you've
              manually set to a special price. Add <strong>575643</strong> here and the tool will leave it alone
              during repricing. You can find the TCGPlayer ID in the first column of your exported CSV file from
              TCGPlayer.
            </Typography>
          </Alert>

          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Add TCGPlayer ID"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newId.trim()) {
                  addId(newId);
                  setNewId("");
                }
              }}
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newId.trim()}
              onClick={() => {
                addId(newId);
                setNewId("");
              }}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentPasteIcon />}
              onClick={() => setShowBulk(!showBulk)}
            >
              {showBulk ? "Hide" : "Bulk Add"}
            </Button>
          </Stack>

          {showBulk && (
            <Stack spacing={1}>
              <TextField
                multiline
                rows={4}
                placeholder="Paste IDs here, separated by commas, spaces, or new lines"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="contained"
                size="small"
                onClick={addBulk}
                disabled={!bulkInput.trim()}
                sx={{ alignSelf: "flex-start" }}
              >
                Add All
              </Button>
            </Stack>
          )}

          <Divider />

          <Typography variant="body2" color="text.secondary">
            {excludedIds.length} excluded item{excludedIds.length !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {excludedIds.map((id) => (
              <Chip
                key={id}
                label={id}
                size="small"
                onDelete={() => onChange(excludedIds.filter((x) => x !== id))}
              />
            ))}
          </Box>

          {excludedIds.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onChange([])}
              sx={{ alignSelf: "flex-start" }}
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

// ============================================================
// Rarity Floors Tab
// ============================================================

function RarityFloorsTab({
  config,
  onChange,
}: {
  config: MarketplacePricingConfig;
  onChange: (config: MarketplacePricingConfig) => void;
}) {
  const [newRarity, setNewRarity] = useState("");
  const [newFloor, setNewFloor] = useState("");

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Default Rarity Floors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Minimum prices based on card rarity. If the calculated price is
            below the floor, the floor price is used instead.
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> With a $2.00 default floor, if a Super Rare card's calculated price comes
              out to $1.50, it will be raised to $2.00 instead. This protects you from listing cards below what
              they're worth. You can set different floors for each rarity — for instance, Commons at $1.00 since
              they're cheaper, but Quarter Century Secret Rares at $2.00 since they're almost always worth more.
            </Typography>
          </Alert>

          <TextField
            label="Default Floor (all unlisted rarities)"
            type="number"
            value={config.defaultRarityFloor}
            onChange={(e) =>
              onChange({
                ...config,
                defaultRarityFloor: parseFloat(e.target.value) || 0,
              })
            }
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            sx={{ maxWidth: 300 }}
          />

          <Table size="small" sx={{ maxWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Rarity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Floor Price</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {config.rarityFloors.map((f, idx) => (
                <TableRow key={f.rarity}>
                  <TableCell>{f.rarity}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={f.floor}
                      onChange={(e) => {
                        const updated = [...config.rarityFloors];
                        updated[idx] = {
                          ...f,
                          floor: parseFloat(e.target.value) || 0,
                        };
                        onChange({ ...config, rarityFloors: updated });
                      }}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        onChange({
                          ...config,
                          rarityFloors: config.rarityFloors.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Rarity name"
                    value={newRarity}
                    onChange={(e) => setNewRarity(e.target.value)}
                    sx={{ width: "100%" }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    placeholder="0.00"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!newRarity.trim() || !newFloor}
                    onClick={() => {
                      onChange({
                        ...config,
                        rarityFloors: [
                          ...config.rarityFloors,
                          {
                            rarity: newRarity.trim(),
                            floor: parseFloat(newFloor) || 0,
                          },
                        ],
                      });
                      setNewRarity("");
                      setNewFloor("");
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      {/* Set-specific overrides */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Set-Specific Floor Overrides
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Override rarity floors for specific sets. The set prefix is the first 3 characters of
            a card's number (e.g., a card numbered "RA02-EN001" has the prefix "RA0").
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> Rarity Collection (RA0) was printed in large quantities, so prices tend
              to be lower. You might set Super Rares from that set to a $0.50 floor instead of the normal $2.00.
              Meanwhile, Duel Terminal (DT0) cards are harder to find, so you might set a higher $2.50 default
              floor for that set. Cards from sets without an override here use the default floors above.
            </Typography>
          </Alert>

          {config.setOverrides.map((override, idx) => (
            <SetOverrideCard
              key={override.setPrefix}
              override={override}
              onChange={(updated) => {
                const newOverrides = [...config.setOverrides];
                newOverrides[idx] = updated;
                onChange({ ...config, setOverrides: newOverrides });
              }}
              onRemove={() =>
                onChange({
                  ...config,
                  setOverrides: config.setOverrides.filter(
                    (_, i) => i !== idx
                  ),
                })
              }
            />
          ))}

          <AddSetOverride
            onAdd={(prefix) =>
              onChange({
                ...config,
                setOverrides: [
                  ...config.setOverrides,
                  { setPrefix: prefix, defaultFloor: 1, rarityFloors: [] },
                ],
              })
            }
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

function SetOverrideCard({
  override,
  onChange,
  onRemove,
}: {
  override: { setPrefix: string; defaultFloor: number; rarityFloors: { rarity: string; floor: number }[] };
  onChange: (o: typeof override) => void;
  onRemove: () => void;
}) {
  const [newRarity, setNewRarity] = useState("");
  const [newFloor, setNewFloor] = useState("");

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={override.setPrefix} color="primary" size="small" />
          <Typography>
            Default: {currencyFormatter.format(override.defaultFloor)}
            {override.rarityFloors.length > 0 &&
              ` | ${override.rarityFloors.length} rarity override${override.rarityFloors.length > 1 ? "s" : ""}`}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Default Floor"
              type="number"
              value={override.defaultFloor}
              onChange={(e) =>
                onChange({
                  ...override,
                  defaultFloor: parseFloat(e.target.value) || 0,
                })
              }
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              sx={{ maxWidth: 200 }}
            />
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={onRemove}
            >
              Remove Set
            </Button>
          </Stack>
          <Table size="small" sx={{ maxWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Rarity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Floor</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {override.rarityFloors.map((f, idx) => (
                <TableRow key={f.rarity}>
                  <TableCell>{f.rarity}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={f.floor}
                      onChange={(e) => {
                        const updated = [...override.rarityFloors];
                        updated[idx] = {
                          ...f,
                          floor: parseFloat(e.target.value) || 0,
                        };
                        onChange({ ...override, rarityFloors: updated });
                      }}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        onChange({
                          ...override,
                          rarityFloors: override.rarityFloors.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Rarity"
                    value={newRarity}
                    onChange={(e) => setNewRarity(e.target.value)}
                    sx={{ width: "100%" }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    placeholder="0.00"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!newRarity.trim() || !newFloor}
                    onClick={() => {
                      onChange({
                        ...override,
                        rarityFloors: [
                          ...override.rarityFloors,
                          {
                            rarity: newRarity.trim(),
                            floor: parseFloat(newFloor) || 0,
                          },
                        ],
                      });
                      setNewRarity("");
                      setNewFloor("");
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function AddSetOverride({ onAdd }: { onAdd: (prefix: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        size="small"
        placeholder="Set prefix (e.g. RA0)"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        sx={{ width: 200 }}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        disabled={!value.trim()}
        onClick={() => {
          onAdd(value.trim());
          setValue("");
        }}
      >
        Add Set Override
      </Button>
    </Stack>
  );
}

// ============================================================
// Pricing Rules Tab
// ============================================================

function PricingRulesTab({
  config,
  onChange,
}: {
  config: MarketplacePricingConfig;
  onChange: (config: MarketplacePricingConfig) => void;
}) {
  return (
    <Stack spacing={3}>
      {/* General */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            General
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              label="Product Line"
              value={config.allowedProductLine}
              onChange={(e) =>
                onChange({ ...config, allowedProductLine: e.target.value })
              }
              size="small"
              helperText='e.g. "YuGiOh" — only YuGiOh cards get repriced; Pokemon or Magic cards in your file are left alone'
            />
            <TextField
              label="Max Price Lock"
              type="number"
              value={config.maxPriceLock}
              onChange={(e) =>
                onChange({
                  ...config,
                  maxPriceLock: parseFloat(e.target.value) || 0,
                })
              }
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              helperText="e.g. $38 — a card priced at $40 won't be touched, protecting expensive cards from market swings"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <Tooltip title='Some cards have a custom "Title" field in TCGPlayer — usually promo versions or special printings. When on, those cards are skipped to avoid mispricing them.'>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.skipTitledItems}
                    onChange={(e) =>
                      onChange({ ...config, skipTitledItems: e.target.checked })
                    }
                  />
                }
                label="Skip titled/promo items"
              />
            </Tooltip>
            <Tooltip title="When on, a card must have both a Market Price and a Low Price to be repriced. If either is blank in your CSV (not enough sales data), the card is skipped to prevent bad pricing.">
              <FormControlLabel
                control={
                  <Switch
                    checked={config.requireBothPrices}
                    onChange={(e) =>
                      onChange({ ...config, requireBothPrices: e.target.checked })
                    }
                  />
                }
                label="Require both market & low prices"
              />
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Undercut */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Undercut Settings
            </Typography>
            <Switch
              checked={config.undercutEnabled}
              onChange={(e) =>
                onChange({ ...config, undercutEnabled: e.target.checked })
              }
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            When enabled, the tool will try to set your price just below the
            lowest competitor when their price is close to the market price.
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> Say a card has a Market Price of $10.00 and the lowest competitor
              is selling at $9.50. With a 90% threshold, the tool checks: is $9.50 at least 90% of $10.00
              (which is $9.00)? Yes — so it undercuts by setting your price to <strong>$9.49</strong> (one
              penny below). If the lowest price were $8.00 (below 90% of market), the tool would use the
              market price instead, since the low price might be artificially cheap.
            </Typography>
          </Alert>
          {config.undercutEnabled && (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Undercut Threshold"
                type="number"
                value={Math.round(config.undercutThreshold * 100)}
                onChange={(e) =>
                  onChange({
                    ...config,
                    undercutThreshold:
                      (parseFloat(e.target.value) || 0) / 100,
                  })
                }
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
                helperText="e.g. 90% — only undercut when the lowest price is reasonable (at least 90% of market), not a fire sale"
              />
              <TextField
                label="Shipping Adjustment"
                type="number"
                value={config.lowShippingAdjust}
                onChange={(e) =>
                  onChange({
                    ...config,
                    lowShippingAdjust: parseFloat(e.target.value) || 0,
                  })
                }
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText="e.g. $1.31 — if Low+Shipping is $3.31 on a cheap card, the tool subtracts $1.31 to get $2.00 as the real card price"
              />
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Drop Protection */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Drop Protection
            </Typography>
            <Switch
              checked={config.dropProtectionEnabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  dropProtectionEnabled: e.target.checked,
                })
              }
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Prevents prices from dropping too far below the current price for
            specified sets, protecting against flash crashes.
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> Say you have a card currently priced at $10.00 and the market suddenly
              dips to $6.00. With a 75% threshold, the tool won't let it drop below $7.50 (75% of your current
              $10.00 price) — it keeps your price at $10.00 instead. This gives you time to check whether the
              dip is real or just a temporary glitch before you lower the price yourself.
            </Typography>
          </Alert>
          {config.dropProtectionEnabled && (
            <>
              <TextField
                label="Threshold"
                type="number"
                value={Math.round(config.dropProtectionThreshold * 100)}
                onChange={(e) =>
                  onChange({
                    ...config,
                    dropProtectionThreshold:
                      (parseFloat(e.target.value) || 0) / 100,
                  })
                }
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
                helperText="e.g. 75% — a $10.00 card won't drop below $7.50 in a single update"
                sx={{ maxWidth: 250 }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Protected Sets
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  alignItems="center"
                >
                  {config.dropProtectionSets.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      onDelete={() =>
                        onChange({
                          ...config,
                          dropProtectionSets:
                            config.dropProtectionSets.filter((x) => x !== s),
                        })
                      }
                    />
                  ))}
                  <AddPrefixInline
                    onAdd={(prefix) =>
                      onChange({
                        ...config,
                        dropProtectionSets: [
                          ...config.dropProtectionSets,
                          prefix,
                        ],
                      })
                    }
                  />
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function AddPrefixInline({ onAdd }: { onAdd: (prefix: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <TextField
      size="small"
      placeholder="Add..."
      value={value}
      onChange={(e) => setValue(e.target.value.toUpperCase())}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) {
          onAdd(value.trim());
          setValue("");
        }
      }}
      sx={{ width: 100 }}
    />
  );
}

// ============================================================
// Price Locks Tab
// ============================================================

function PriceLocksTab({
  lockedSets,
  lockedCards,
  lockMode,
  onLockedSetsChange,
  onLockedCardsChange,
  onLockModeChange,
}: {
  lockedSets: string[];
  lockedCards: CardLock[];
  lockMode: LockMode;
  onLockedSetsChange: (sets: string[]) => void;
  onLockedCardsChange: (cards: CardLock[]) => void;
  onLockModeChange: (mode: LockMode) => void;
}) {
  const [newSet, setNewSet] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardRarity, setNewCardRarity] = useState("");

  const addSet = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !lockedSets.includes(trimmed)) {
      onLockedSetsChange([...lockedSets, trimmed]);
    }
  };

  const addCard = () => {
    const number = newCardNumber.trim();
    const rarity = newCardRarity.trim();
    if (
      number &&
      rarity &&
      !lockedCards.some((c) => c.number === number && c.rarity === rarity)
    ) {
      onLockedCardsChange([...lockedCards, { number, rarity }]);
      setNewCardNumber("");
      setNewCardRarity("");
    }
  };

  return (
    <Stack spacing={3}>
      {/* Lock Mode */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Lock Mode
            </Typography>
            <Tooltip title="Controls how locks behave: Full blocks all price changes, Partial only blocks decreases (allows increases).">
              <HelpOutlineIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Choose how locked sets and cards behave when the pricing engine runs.
          </Typography>

          <ToggleButtonGroup
            value={lockMode}
            exclusive
            onChange={(_e, value) => {
              if (value !== null) onLockModeChange(value as LockMode);
            }}
            size="small"
          >
            <ToggleButton value="full">
              Full Lock
            </ToggleButton>
            <ToggleButton value="partial">
              Partial Lock
            </ToggleButton>
          </ToggleButtonGroup>

          {lockMode === "full" ? (
            <Alert severity="warning" variant="outlined">
              <strong>Full lock</strong> — Locked items will not have any price changes, neither increases nor decreases.
            </Alert>
          ) : (
            <Alert severity="info" variant="outlined">
              <strong>Partial lock</strong> — Locked items can still have price <em>increases</em>, but price decreases are blocked. Useful for protecting against drops while still allowing upward movement.
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Set Locks */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Set Locks
            </Typography>
            <Tooltip title={lockMode === "full"
              ? "Locked sets will have no price changes at all — neither increases nor decreases."
              : "Locked sets will only allow price increases — decreases are blocked."
            }>
              <HelpOutlineIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Lock entire sets to prevent {lockMode === "full" ? "any" : "downward"} price changes. You can also toggle
            set locks directly from the results table next to the set name.
          </Typography>

          <Alert severity="warning" variant="outlined">
            {lockMode === "full"
              ? "Set locks block all price changes — both increases and decreases."
              : "Set locks block price decreases — increases are still allowed."}
          </Alert>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> If you lock "2024 Collectors Tin", none of the cards from that set will
              have their prices changed — they stay exactly where you set them, even if the market goes up or
              down. This is useful for sets where you've manually priced everything and don't want the tool to
              override your work. The set name must match exactly as it appears in your CSV file (e.g., "2009
              Collectors Tin", not just "2009").
            </Typography>
          </Alert>

          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Set name"
              value={newSet}
              onChange={(e) => setNewSet(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSet.trim()) {
                  addSet(newSet);
                  setNewSet("");
                }
              }}
              sx={{ width: 300 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newSet.trim()}
              onClick={() => {
                addSet(newSet);
                setNewSet("");
              }}
            >
              Add
            </Button>
          </Stack>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            {lockedSets.length} locked set{lockedSets.length !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {lockedSets.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                color="warning"
                icon={<LockIcon />}
                onDelete={() =>
                  onLockedSetsChange(lockedSets.filter((x) => x !== s))
                }
              />
            ))}
          </Box>

          {lockedSets.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onLockedSetsChange([])}
              sx={{ alignSelf: "flex-start" }}
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Card Locks */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Card Locks
            </Typography>
            <Tooltip title={lockMode === "full"
              ? "Locked cards (by number + rarity) will have no price changes at all."
              : "Locked cards (by number + rarity) will only allow price increases — decreases are blocked."
            }>
              <HelpOutlineIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Lock individual cards by their card number and rarity to prevent {lockMode === "full" ? "any" : "downward"}{" "}
            price changes. You can also toggle card locks from the results table
            using the lock icon in the Actions column.
          </Typography>

          <Alert severity="info" variant="outlined" icon={false}>
            <Typography variant="body2">
              <strong>Example:</strong> Locking card number <strong>BPT-009</strong> with rarity <strong>Secret
              Rare</strong> would freeze the price on that specific Blue-Eyes White Dragon printing. All
              conditions (Near Mint, Lightly Played, etc.) of that exact card number + rarity combo are locked.
              Other Blue-Eyes printings with different card numbers would still be repriced normally.
            </Typography>
          </Alert>

          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Card number"
              value={newCardNumber}
              onChange={(e) => setNewCardNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard();
              }}
              sx={{ width: 200 }}
            />
            <TextField
              size="small"
              label="Rarity"
              value={newCardRarity}
              onChange={(e) => setNewCardRarity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard();
              }}
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newCardNumber.trim() || !newCardRarity.trim()}
              onClick={addCard}
            >
              Add
            </Button>
          </Stack>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            {lockedCards.length} locked card{lockedCards.length !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {lockedCards.map((c) => (
              <Chip
                key={`${c.number}|${c.rarity}`}
                label={`${c.number} (${c.rarity})`}
                size="small"
                icon={<LockIcon />}
                onDelete={() =>
                  onLockedCardsChange(
                    lockedCards.filter(
                      (x) => !(x.number === c.number && x.rarity === c.rarity)
                    )
                  )
                }
              />
            ))}
          </Box>

          {lockedCards.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onLockedCardsChange([])}
              sx={{ alignSelf: "flex-start" }}
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

// ============================================================
// Buylist Tab
// ============================================================

function BuylistTab({
  config,
  onChange,
}: {
  config: BuylistPricingConfig;
  onChange: (config: BuylistPricingConfig) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={700}>
          Buylist Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The buylist tool sets your offer price as a percentage of the reference
          price. This is the price you're willing to pay when buying cards from other sellers.
        </Typography>

        <Alert severity="info" variant="outlined" icon={false}>
          <Typography variant="body2">
            <strong>How it works:</strong> If you set this to 85%, a card with a $10.00 market price will get a
            buylist offer of $8.50. Lower percentages (e.g., 70%) give you better profit margins but your offers
            may be too low to attract sellers. Higher percentages (e.g., 90%) make your offers more competitive
            but leave less room for profit when you resell.
          </Typography>
        </Alert>
        <TextField
          label="Buy at % of reference price"
          type="number"
          value={Math.round(config.percentage * 100)}
          onChange={(e) =>
            onChange({
              percentage: (parseFloat(e.target.value) || 0) / 100,
            })
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">%</InputAdornment>
            ),
          }}
          helperText={`Example: a $10 market card would have a buylist price of ${currencyFormatter.format(10 * config.percentage)}`}
          sx={{ maxWidth: 300 }}
        />
      </Stack>
    </Paper>
  );
}
