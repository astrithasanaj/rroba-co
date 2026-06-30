import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { getCategory } from "@/lib/categories";

const BG = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";

export const Route = createFileRoute("/category/$slug/choose-gender")({
  component: GenderSelectPage,
});

function GenderSelectPage() {
  const { slug } = useParams({ from: "/category/$slug/choose-gender" });
  const navigate = useNavigate();
  const def = getCategory(slug);

  if (!def || !def.hasGender || !def.genderOptions) {
    // No gender step: bounce to all
    navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" }, replace: true });
    return null;
  }

  return (
    <MobileShell>
      <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="pb-32">
        <header className="relative flex items-center justify-center px-5 pt-6 pb-2">
          <Link
            to="/"
            className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: INK }} />
          </Link>
          <h1 className="text-[17px] font-bold" style={{ color: INK }}>
            {def.label}
          </h1>
        </header>

        <div className="px-5 pt-8">
          <h2 className="text-[22px] font-bold leading-tight" style={{ color: INK }}>
            Për kend po kërkon?
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {def.genderOptions.map((g) => (
              <Link
                key={g.slug}
                to="/category/$slug/$gender"
                params={{ slug, gender: g.slug }}
                className="flex flex-col items-center justify-center rounded-2xl"
                style={{ backgroundColor: CARD, height: 140, color: INK }}
              >
                <span style={{ fontSize: 36, lineHeight: 1, color: INK }}>{g.symbol}</span>
                <span className="mt-3 text-[15px] font-bold" style={{ color: INK }}>
                  {g.label}
                </span>
              </Link>
            ))}
          </div>

          <Link
            to="/category/$slug/$gender"
            params={{ slug, gender: "all" }}
            className="mt-4 flex h-12 items-center justify-center rounded-full border text-[14px] font-semibold"
            style={{ borderColor: INK, color: INK, backgroundColor: "transparent" }}
          >
            Shiko të gjitha
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
