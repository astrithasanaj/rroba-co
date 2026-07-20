import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/marketplace/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { UserCollectionsProvider } from "@/lib/user-collections";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Faqja nuk u gjet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Faqja që po kërkon nuk ekziston ose është zhvendosur.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kthehu në ballinë
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Kjo faqe nuk u ngarkua
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Diçka shkoi keq nga ana jonë. Provo ta rifreskosh ose kthehu në ballinë.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Provo përsëri
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Kthehu në ballinë
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Rroba — Blej, shit dhe zbulo stil të ri." },
      { name: "description", content: "Tregu i modës së përdorur në Kosovë. Blej dhe shit rroba, këpucë dhe aksesorë në Prishtinë, Prizren, Pejë dhe Tiranë." },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "Rroba — Blej, shit dhe zbulo stil të ri." },
      { property: "og:description", content: "Tregu i modës së përdorur në Kosovë. Blej dhe shit rroba, këpucë dhe aksesorë në Prishtinë, Prizren, Pejë dhe Tiranë." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Rroba — Blej, shit dhe zbulo stil të ri." },
      { name: "twitter:description", content: "Tregu i modës së përdorur në Kosovë. Blej dhe shit rroba, këpucë dhe aksesorë në Prishtinë, Prizren, Pejë dhe Tiranë." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58ecbfef-0d51-4de0-8904-4e004eb8d663/id-preview-23ae731a--4cf62126-3235-423c-8863-d4b9d1e5f656.lovable.app-1782077977267.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58ecbfef-0d51-4de0-8904-4e004eb8d663/id-preview-23ae731a--4cf62126-3235-423c-8863-d4b9d1e5f656.lovable.app-1782077977267.png" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <div id="nav-bar-root" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideBottomNav =
    pathname === "/sell" ||
    pathname === "/onboarding" ||
    pathname === "/blocked" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth") ||
    /^\/listing\/[^/]+\/(edit|promote|premium)$/.test(pathname);

  const [navRoot, setNavRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setNavRoot(document.getElementById("nav-bar-root"));
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      } else {
        queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <UserCollectionsProvider>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
          }}
        >
          <OnboardingGate />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <Toaster />
        {navRoot && !hideBottomNav ? createPortal(<BottomNav />, navRoot) : null}
      </UserCollectionsProvider>
    </QueryClientProvider>
  );
}

const ONBOARDING_EXEMPT = new Set([
  "/onboarding",
  "/auth",
  "/reset-password",
]);

function OnboardingGate() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    const check = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      const completed = (data as { onboarding_completed?: boolean } | null)
        ?.onboarding_completed;
      const pathname = router.state.location.pathname;
      if (completed === false && !ONBOARDING_EXEMPT.has(pathname)) {
        router.navigate({ to: "/onboarding", replace: true });
      }
    };
    getCurrentUser().then((user) => {
      if (data.user) check(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) check(session.user.id);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);
  return null;
}

