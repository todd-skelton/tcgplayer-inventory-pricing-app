import React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLocation,
} from "react-router";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  AppBar,
  Toolbar,
  Typography,
  Stack,
  Tooltip,
  IconButton,
  Box,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Route } from "./+types/root";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    dark: true,
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: <HomeIcon /> },
    { label: "Marketplace", path: "/marketplace", icon: <StorefrontIcon /> },
    { label: "Buylist", path: "/buylist", icon: <ShoppingCartIcon /> },
    { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <AppBar position="static" elevation={1}>
              <Toolbar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    cursor: "pointer",
                    mr: 4,
                  }}
                  onClick={() => navigate("/")}
                >
                  TCG Price Manager
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      startIcon={item.icon}
                      onClick={() => navigate(item.path)}
                      sx={{
                        opacity: location.pathname === item.path ? 1 : 0.7,
                        borderBottom:
                          location.pathname === item.path
                            ? "2px solid white"
                            : "2px solid transparent",
                        borderRadius: 0,
                        px: 2,
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Toolbar>
            </AppBar>
            <Box
              component="main"
              sx={{ flexGrow: 1, bgcolor: "background.default", py: 3 }}
            >
              {children}
            </Box>
          </Box>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 8 }}>
      <Typography variant="h3" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {details}
      </Typography>
      {stack && (
        <Box
          component="pre"
          sx={{ mt: 2, p: 2, overflow: "auto", bgcolor: "grey.900", borderRadius: 1 }}
        >
          <code>{stack}</code>
        </Box>
      )}
    </Box>
  );
}
