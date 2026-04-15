import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard/dashboard.tsx"),
  route("marketplace", "routes/marketplace/marketplace.tsx"),
  route("buylist", "routes/buylist/buylist.tsx"),
  route("settings", "routes/settings/settings.tsx"),
] satisfies RouteConfig;
