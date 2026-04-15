import {
  Paper,
  Typography,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  Chip,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useState } from "react";
import type { MarketplacePricingConfig, RarityFloor, SetOverride } from "~/engine/types";

interface MarketplaceSettingsPanelProps {
  config: MarketplacePricingConfig;
  onChange: (config: MarketplacePricingConfig) => void;
}

export default function MarketplaceSettingsPanel({
  config,
  onChange,
}: MarketplaceSettingsPanelProps) {
  const update = (patch: Partial<MarketplacePricingConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <Stack spacing={2}>
      {/* General Settings */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>General Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Product Line"
                value={config.allowedProductLine}
                onChange={(e) =>
                  update({ allowedProductLine: e.target.value })
                }
                size="small"
                helperText="Only items from this product line will be repriced"
              />
              <TextField
                label="Max Price Lock"
                type="number"
                value={config.maxPriceLock}
                onChange={(e) =>
                  update({ maxPriceLock: parseFloat(e.target.value) || 0 })
                }
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText="Items priced at or above this amount will not be changed"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.skipTitledItems}
                    onChange={(e) =>
                      update({ skipTitledItems: e.target.checked })
                    }
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Skip titled items</span>
                    <Tooltip title="Items with custom titles (like promo cards) will not be repriced">
                      <HelpOutlineIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.requireBothPrices}
                    onChange={(e) =>
                      update({ requireBothPrices: e.target.checked })
                    }
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Require both market & low prices</span>
                    <Tooltip title="Items missing either market price or low price will be skipped">
                      <HelpOutlineIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
              />
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Undercut Settings */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Undercut Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.undercutEnabled}
                  onChange={(e) =>
                    update({ undercutEnabled: e.target.checked })
                  }
                />
              }
              label="Enable undercut pricing"
            />
            {config.undercutEnabled && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Undercut Threshold"
                  type="number"
                  value={Math.round(config.undercutThreshold * 100)}
                  onChange={(e) =>
                    update({
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
                  helperText="Undercut when lowest price is within this % of market price"
                />
                <TextField
                  label="Shipping Cost Adjustment"
                  type="number"
                  value={config.lowShippingAdjust}
                  onChange={(e) =>
                    update({
                      lowShippingAdjust: parseFloat(e.target.value) || 0,
                    })
                  }
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  helperText="Deducted from low+shipping price for items under $5"
                />
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Drop Protection */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Drop Protection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.dropProtectionEnabled}
                  onChange={(e) =>
                    update({ dropProtectionEnabled: e.target.checked })
                  }
                />
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <span>Enable drop protection</span>
                  <Tooltip title="Prevents prices from dropping too far below current price for specified sets">
                    <HelpOutlineIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
              }
            />
            {config.dropProtectionEnabled && (
              <>
                <TextField
                  label="Drop Protection Threshold"
                  type="number"
                  value={Math.round(config.dropProtectionThreshold * 100)}
                  onChange={(e) =>
                    update({
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
                  helperText="Don't let price drop below this % of current price"
                  sx={{ maxWidth: 300 }}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Protected Set Prefixes
                  </Typography>
                  <SetPrefixEditor
                    values={config.dropProtectionSets}
                    onChange={(sets) =>
                      update({ dropProtectionSets: sets })
                    }
                  />
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Rarity Floors */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Rarity Price Floors</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Default Floor (all other rarities)"
              type="number"
              value={config.defaultRarityFloor}
              onChange={(e) =>
                update({
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
            <RarityFloorTable
              label="Common Rarity Floors"
              floors={config.rarityFloors}
              onChange={(floors) => update({ rarityFloors: floors })}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Set Overrides */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Set-Specific Overrides</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {config.setOverrides.map((override, idx) => (
              <SetOverrideEditor
                key={override.setPrefix}
                override={override}
                onChange={(updated) => {
                  const newOverrides = [...config.setOverrides];
                  newOverrides[idx] = updated;
                  update({ setOverrides: newOverrides });
                }}
                onRemove={() => {
                  update({
                    setOverrides: config.setOverrides.filter(
                      (_, i) => i !== idx
                    ),
                  });
                }}
              />
            ))}
            <AddSetOverrideButton
              onAdd={(prefix) => {
                update({
                  setOverrides: [
                    ...config.setOverrides,
                    { setPrefix: prefix, defaultFloor: 1, rarityFloors: [] },
                  ],
                });
              }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SetPrefixEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [newValue, setNewValue] = useState("");

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      {values.map((v) => (
        <Chip
          key={v}
          label={v}
          onDelete={() => onChange(values.filter((x) => x !== v))}
          sx={{ mb: 1 }}
        />
      ))}
      <TextField
        size="small"
        placeholder="Add prefix..."
        value={newValue}
        onChange={(e) => setNewValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newValue.trim()) {
            onChange([...values, newValue.trim()]);
            setNewValue("");
          }
        }}
        sx={{ width: 120, mb: 1 }}
      />
    </Stack>
  );
}

function RarityFloorTable({
  label,
  floors,
  onChange,
}: {
  label: string;
  floors: RarityFloor[];
  onChange: (floors: RarityFloor[]) => void;
}) {
  const [newRarity, setNewRarity] = useState("");
  const [newFloor, setNewFloor] = useState("");

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      <Table size="small" sx={{ maxWidth: 500 }}>
        <TableHead>
          <TableRow>
            <TableCell>Rarity</TableCell>
            <TableCell>Floor Price</TableCell>
            <TableCell width={50} />
          </TableRow>
        </TableHead>
        <TableBody>
          {floors.map((f, idx) => (
            <TableRow key={f.rarity}>
              <TableCell>{f.rarity}</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={f.floor}
                  onChange={(e) => {
                    const updated = [...floors];
                    updated[idx] = {
                      ...f,
                      floor: parseFloat(e.target.value) || 0,
                    };
                    onChange(updated);
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
                  onClick={() => onChange(floors.filter((_, i) => i !== idx))}
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
                  onChange([
                    ...floors,
                    {
                      rarity: newRarity.trim(),
                      floor: parseFloat(newFloor) || 0,
                    },
                  ]);
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
    </Box>
  );
}

function SetOverrideEditor({
  override,
  onChange,
  onRemove,
}: {
  override: SetOverride;
  onChange: (override: SetOverride) => void;
  onRemove: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography fontWeight={600}>
            Set: {override.setPrefix}
          </Typography>
          <IconButton size="small" color="error" onClick={onRemove}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
        <TextField
          label="Default Floor for this Set"
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
          sx={{ maxWidth: 250 }}
        />
        <RarityFloorTable
          label={`${override.setPrefix} Rarity Floors`}
          floors={override.rarityFloors}
          onChange={(floors) => onChange({ ...override, rarityFloors: floors })}
        />
      </Stack>
    </Paper>
  );
}

function AddSetOverrideButton({ onAdd }: { onAdd: (prefix: string) => void }) {
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
