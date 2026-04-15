import { Typography, Stack, Box } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {icon && (
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: 2,
              p: 1.5,
              display: "flex",
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Stack>
      {action && <Box>{action}</Box>}
    </Stack>
  );
}
