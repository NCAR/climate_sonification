// src/routing/useNavigationShim.js
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTES = {
  Home: "/",
  AllTogether: "/all-together",
  EachAlone: "/each-alone",
  About: "/about",
};

function parseQuery(search) {
  const sp = new URLSearchParams(search || "");
  const params = {};
  for (const [k, v] of sp.entries()) {
    // best-effort coercion: "123" -> 123, otherwise keep string
    const num = Number(v);
    params[k] = Number.isFinite(num) && String(num) === v ? num : v;
  }
  return params;
}

export function useNavigationShim() {
  const rrNavigate = useNavigate();
  const location = useLocation();

  const route = useMemo(() => {
    return { params: parseQuery(location.search) };
  }, [location.search]);

  const navigation = useMemo(() => {
    return {
      goBack: () => rrNavigate(-1),

      navigate: (screenName, params) => {
        const path = ROUTES[screenName];
        if (!path) {
          throw new Error(
            `Unknown screen "${screenName}". Add it to ROUTES in useNavigationShim.js.`,
          );
        }

        if (params && Object.keys(params).length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) qs.set(k, String(v));
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
