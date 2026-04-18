import {
  Stack,
  TextField,
  Autocomplete,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  InputAdornment,
  Button,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";

export interface FilterState {
  search: string;
  sets: string[];
  rarities: string[];
  conditions: string[];
  changeDirection: "all" | "up" | "down";
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  sets: [],
  rarities: [],
  conditions: [],
  changeDirection: "all",
};

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== "" ||
    filters.sets.length > 0 ||
    filters.rarities.length > 0 ||
    filters.conditions.length > 0 ||
    filters.changeDirection !== "all"
  );
}

interface ResultsFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableSets: string[];
  availableRarities: string[];
  availableConditions: string[];
  totalCount: number;
  filteredCount: number;
}

export default function ResultsFilterBar({
  filters,
  onFiltersChange,
  availableSets,
  availableRarities,
  availableConditions,
  totalCount,
  filteredCount,
}: ResultsFilterBarProps) {
  const active = hasActiveFilters(filters);

  return (
    <Stack
      spacing={1.5}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: active ? "primary.main" : "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Row 1: Search + change direction + clear */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Search by name, set, number, or rarity..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 280, flex: 1 }}
        />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={filters.changeDirection}
          onChange={(_, val) => {
            if (val !== null) {
              onFiltersChange({ ...filters, changeDirection: val });
            }
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="up" color="success">
            <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
            Up
          </ToggleButton>
          <ToggleButton value="down" color="error">
            <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
            Down
          </ToggleButton>
        </ToggleButtonGroup>

        {active && (
          <Button
            size="small"
            startIcon={<FilterListOffIcon />}
            onClick={() => onFiltersChange(EMPTY_FILTERS)}
          >
            Clear
          </Button>
        )}
      </Stack>

      {/* Row 2: Multi-select filters */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Autocomplete
          multiple
          size="small"
          options={availableSets}
          value={filters.sets}
          onChange={(_, val) => onFiltersChange({ ...filters, sets: val })}
          renderInput={(params) => (
            <TextField {...params} placeholder="Filter by set..." />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  variant="outlined"
                  {...rest}
                />
              );
            })
          }
          sx={{ minWidth: 200, flex: 1 }}
          limitTags={2}
        />

        <Autocomplete
          multiple
          size="small"
          options={availableRarities}
          value={filters.rarities}
          onChange={(_, val) => onFiltersChange({ ...filters, rarities: val })}
          renderInput={(params) => (
            <TextField {...params} placeholder="Filter by rarity..." />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  variant="outlined"
                  {...rest}
                />
              );
            })
          }
          sx={{ minWidth: 180, flex: 1 }}
          limitTags={2}
        />

        <Autocomplete
          multiple
          size="small"
          options={availableConditions}
          value={filters.conditions}
          onChange={(_, val) =>
            onFiltersChange({ ...filters, conditions: val })
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Filter by condition..." />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  variant="outlined"
                  {...rest}
                />
              );
            })
          }
          sx={{ minWidth: 180, flex: 1 }}
          limitTags={2}
        />

        {/* Result count */}
        <Box sx={{ whiteSpace: "nowrap", pl: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {active
              ? `${filteredCount} of ${totalCount} items`
              : `${totalCount} items`}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
