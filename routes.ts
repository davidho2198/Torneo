import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("torneos", "routes/tournaments.tsx"),
  route("login", "routes/login.tsx"),
  route("registro", "routes/register.tsx"),
  route("panel", "routes/dashboard.tsx"),
] satisfies RouteConfig;
