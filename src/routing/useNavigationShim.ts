import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTES = {
  Home: "/",
  AllTogether: "/all-together",
  EachAlone: "/each-alone",
  About: "/about",
} as const;

export type ScreenName = keyof typeof ROUTES;

export type RouteParamValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type RouteParams = Record<string, RouteParamValue>;

export interface Navigation {
  goBack: () => void;
  navigate: (screenName: ScreenName, params?: RouteParams) => void;
}

export interface Route {
  params: RouteParams;
}

function parseQuery(search: string): RouteParams {
  const sp = new URLSearchParams(search || "");
  const params: RouteParams = {};

  for (const [k, v] of sp.entries()) {
    const num = Number(v);
    params[k] = Number.isFinite(num) && String(num) === v ? num : v;
  }

  return params;
}
function buildQuery(params?: RouteParams): string {
  if (!params) return "";

  const sp = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    sp.set(k, String(v));
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function useNavigationShim(): {
  navigation: Navigation;
  route: Route;
} {
  const rrNavigate = useNavigate();
  const location = useLocation();

  const route = useMemo<Route>(() => {
    return { params: parseQuery(location.search) };
  }, [location.search]);

  const navigation = useMemo<Navigation>(() => {
    return {
      goBack: (): void => { rrNavigate(-1) },

      navigate: (screenName: ScreenName, params?: RouteParams): void => {
        const path = ROUTES[screenName];
        rrNavigate(`${path}${buildQuery(params)}`);
      },
    };
  }, [rrNavigate]);

  return { navigation, route };
}
