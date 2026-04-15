import { Paper, Typography, Stack, Box } from "@mui/material";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  delta?: number;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  delta,
  subtitle,
}: StatCardProps) {
  const deltaColor =
    delta !== undefined
      ? delta > 0
        ? "success.main"
        : delta < 0
        ? "error.main"
        : "text.secondary"
      : undefined;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        flex: 1,
        minWidth: 160,
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && (
            <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
          )}
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
        </Stack>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: deltaColor }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
