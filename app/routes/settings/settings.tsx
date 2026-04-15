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

import PageHeader from "~/components/PageHeader";
import { useLocalStorageState } from "~/hooks/useLocalStorageState";
import {
  DEFAULT_MARKETPLACE_CONFIG,
  DEFAULT_BUYLIST_CONFIG,
} from "~/engine/defaults";
import { currencyFormatter } from "~/engine/formatters";
import type {
  MarketplacePricingConfig,
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

      {/* Tab 3: Buylist */}
      {tab === 3 && (
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
            Override rarity floors for specific sets. Use the 3-character set
            prefix (e.g., "RA0" for Rarity Collection).
          </Typography>

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
              helperText="Only items from this product line will be repriced"
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
              helperText="Don't reprice items at or above this price"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
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
                helperText="Undercut when low price is within this % of market"
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
                helperText="Deducted from low+shipping for items under $5"
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
                helperText="Don't let price fall below this % of current"
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
          price. Lower percentages give better margins but may attract fewer
          sellers.
        </Typography>
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
