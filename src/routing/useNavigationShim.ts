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
      goBack: () => rrNavigate(-1),

      navigate: (screenName, params) => {
        const path = ROUTES[screenName];
        if (!path) {
          throw new Error(
            `Unknown screen "${screenName}". Add it to ROUTES in useNavigationShim.ts.`,
          );
        }

        if (params && Object.keys(params).length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) {
              qs.set(k, String(v));
            }
          }
          rrNavigate(`${path}?${qs.toString()}`);
        } else {
          rrNavigate(path);
        }
      },
    };
  }, [rrNavigate]);

  return { navigation, route };
}
