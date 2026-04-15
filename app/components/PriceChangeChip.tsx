import { Chip } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { changeCurrencyFormatter, changePercentageFormatter } from "~/engine/formatters";

interface PriceChangeChipProps {
  current: number;
  updated: number;
  showPercent?: boolean;
}

export default function PriceChangeChip({
  current,
  updated,
  showPercent = false,
}: PriceChangeChipProps) {
  const delta = updated - current;
  const pct = current !== 0 ? delta / current : 0;

  if (delta === 0) {
    return (
      <Chip
        icon={<TrendingFlatIcon />}
        label="No change"
        size="small"
        variant="outlined"
      />
    );
  }

  const label = showPercent
    ? changePercentageFormatter.format(pct)
    : changeCurrencyFormatter.format(delta);

  return (
    <Chip
      icon={delta > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
      label={label}
      size="small"
      color={delta > 0 ? "success" : "error"}
      variant="outlined"
    />
  );
}
