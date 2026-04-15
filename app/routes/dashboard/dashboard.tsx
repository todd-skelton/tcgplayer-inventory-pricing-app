import type { Route } from "./+types/dashboard";
import { useNavigate } from "react-router";
import {
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Paper,
  Chip,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TCG Price Manager" },
    {
      name: "description",
      content: "Manage and optimize your TCGPlayer inventory pricing.",
    },
  ];
}

interface WorkflowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
  color: string;
  onClick: () => void;
}

function WorkflowCard({
  title,
  description,
  icon,
  steps,
  color,
  onClick,
}: WorkflowCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        flex: 1,
        minWidth: 280,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: color,
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              bgcolor: color,
              color: "white",
              borderRadius: 2,
              p: 1.5,
              display: "inline-flex",
              width: "fit-content",
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Stack spacing={1}>
            {steps.map((step, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Chip
                  label={i + 1}
                  size="small"
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: "0.7rem",
                    "& .MuiChip-label": { px: 0 },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {step}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={onClick}
          sx={{
            bgcolor: color,
            "&:hover": { bgcolor: color, filter: "brightness(0.9)" },
          }}
        >
          Get Started
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Stack spacing={4}>
        {/* Hero */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(156, 39, 176, 0.08) 100%)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 1 }}
          >
            <TrendingUpIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={800}>
              TCG Price Manager
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Automatically optimize your TCGPlayer inventory pricing. Upload your
            CSV exports, review the calculated price updates, and download the
            result for bulk import back into TCGPlayer.
          </Typography>
        </Paper>

        {/* Workflow Cards */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
        >
          <WorkflowCard
            title="Update Marketplace Prices"
            description="Optimize your marketplace listing prices using smart undercut logic, rarity-based floors, and drop protection."
            icon={<StorefrontIcon />}
            steps={[
              "Upload your Inventory Export CSV",
              "Review pricing settings",
              "Preview price changes",
              "Download updated CSV",
            ]}
            color="#1976d2"
            onClick={() => navigate("/marketplace")}
          />
          <WorkflowCard
            title="Update Buylist Prices"
            description="Set competitive buylist prices based on market and high prices to attract sellers at the right margins."
            icon={<ShoppingCartIcon />}
            steps={[
              "Upload your Buylist Export CSV",
              "Set your target percentage",
              "Preview buylist changes",
              "Download updated CSV",
            ]}
            color="#9c27b0"
            onClick={() => navigate("/buylist")}
          />
          <WorkflowCard
            title="Configure Settings"
            description="Manage your pricing rules, rarity floors, excluded items, and drop protection configuration."
            icon={<SettingsIcon />}
            steps={[
              "Set rarity price floors",
              "Manage excluded items",
              "Configure drop protection",
              "Adjust undercut thresholds",
            ]}
            color="#ed6c02"
            onClick={() => navigate("/settings")}
          />
        </Stack>

        {/* How it works */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This tool processes your TCGPlayer CSV exports and applies pricing
            rules to calculate optimized prices. No coding required.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            {[
              {
                step: "1",
                title: "Export from TCGPlayer",
                desc: "Go to your TCGPlayer seller portal and export your inventory as a CSV file.",
              },
              {
                step: "2",
                title: "Upload & Process",
                desc: "Upload the CSV here. The tool applies your pricing rules to calculate new prices.",
              },
              {
                step: "3",
                title: "Review Changes",
                desc: "See a summary and detailed table of all price changes before you commit.",
              },
              {
                step: "4",
                title: "Import Back",
                desc: "Download the updated CSV and import it back into TCGPlayer's bulk update tool.",
              },
            ].map(({ step, title, desc }) => (
              <Box key={step} sx={{ flex: 1 }}>
                <Chip
                  label={`Step ${step}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
