import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Sparkles,
  Shirt,
  Baby,
  Sofa,
  Mountain,
  Palette,
  Smartphone,
  Gamepad2,
  Tag,
} from "lucide-react";
import {
  CATEGORY_TAXONOMY,
  groupLeafLabels,
  type CategoryNode,
  type CategorySelection,
  type SubcategoryNode,
} from "@/lib/category-taxonomy";

/* ------------------------------------------------------------------ */
/* Palette                                                            */
/* ------------------------------------------------------------------ */
const BG = "#ffffff";
const HEADER_BG = "#2d1521";
const HEADER_INK = "#ffffff";
const HEADER_MUTED = "rgba(255,255,255,0.55)";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2e2de";
const CHEV = "#a89f94";
const CORAL_ACTIVE = "#c65a7a";
const CORAL_GRADIENT = "linear-gradient(120deg, #e8836a, #c65a7a)";
const OUTLET_RED = "#b3392f";

type GenderKey = "femra" | "meshkuj" | "femije";
const GENDER_TABS: { key: GenderKey; label: string }[] = [
  { key: "femra", label: "Femra" },
  { key: "meshkuj", label: "Meshkuj" },
  { key: "femije", label: "Fëmijë" },
];

/* Mapping from taxonomy node key to /category/$slug in the app */
const NODE_TO_SLUG: Record<string, string | undefined> = {
  mode: "mode",
  femije: "femije",
  outdoor: "outdoor",
  interior: "interior",
  art: "art",
  elektronik: "elektronik",
  hobi: undefined, // no dedicated listing route → fall back to /search
};

const NODE_ICON: Record<string, typeof Shirt> = {
  mode: Shirt,
  femije: Baby,
  interior: Sofa,
  outdoor: Mountain,
  art: Palette,
  elektronik: Smartphone,
  hobi: Gamepad2,
};

function genderToSlug(g: GenderKey, node: CategoryNode): string {
  if (node.key === "femije") return g === "femije" ? "vajza" : "all";
  if (g === "femra") return "femra";
  if (g === "meshkuj") return "meshkuj";
  return "all";
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

type Level =
  | { kind: "root" }
  | { kind: "node"; node: CategoryNode }
  | { kind: "group"; node: CategoryNode; group: SubcategoryNode };

export function CategoryPickerSheet({
  open,
  onOpenChange,
  // Legacy props kept for caller compatibility; not used in drill-down mode.
  value: _value,
  onApply: _onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value?: CategorySelection;
  onApply?: (sel: CategorySelection) => void;
}) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [gender, setGender] = useState<GenderKey>("femra");
  const [stack, setStack] = useState<Level[]>([{ kind: "root" }]);
  const [query, setQuery] = useState("");

  // Swipe-back on the top-level page
  const pageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setStack([{ kind: "root" }]);
      setQuery("");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  const close = () => onOpenChange(false);
  const current = stack[stack.length - 1];

  const goBack = () => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
    else close();
  };

  const openNode = (node: CategoryNode) =>
    setStack((s) => [...s, { kind: "node", node }]);
  const openGroup = (node: CategoryNode, group: SubcategoryNode) =>
    setStack((s) => [...s, { kind: "group", node, group }]);

  const navigateToNode = (node: CategoryNode) => {
    const slug = NODE_TO_SLUG[node.key];
    if (!slug) {
      navigate({ to: "/search", search: { category: node.categories[0] } as never });
    } else {
      navigate({
        to: "/category/$slug/$gender",
        params: { slug, gender: genderToSlug(gender, node) },
      });
    }
    close();
  };

  const navigateToLeaf = (node: CategoryNode, leafLabel: string) => {
    const slug = NODE_TO_SLUG[node.key];
    if (!slug) {
      navigate({ to: "/search", search: { q: leafLabel } as never });
    } else {
      navigate({
        to: "/category/$slug/$gender",
        params: { slug, gender: genderToSlug(gender, node) },
        search: { subcategories: leafLabel } as never,
      });
    }
    close();
  };

  const navigateTrending = () => {
    navigate({ to: "/search", search: { section: "trending" } as never });
    close();
  };

  /* Swipe-back only on root level (child levels have their own back button) */
  const onTouchStart = (e: React.TouchEvent) => {
    if (current.kind !== "root") return;
    const t = e.touches[0];
    if (t.clientX <= 24) {
      touchStart.current = { x: t.clientX, y: t.clientY };
      dragging.current = false;
    } else {
      touchStart.current = null;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !pageRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (!dragging.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      dragging.current = true;
    }
    if (dragging.current && dx > 0) {
      pageRef.current.style.transition = "none";
      pageRef.current.style.transform = `translateX(${dx}px)`;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !pageRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    pageRef.current.style.transition = "";
    pageRef.current.style.transform = "";
    touchStart.current = null;
    if (dragging.current && dx > 80) close();
    dragging.current = false;
  };

  /* Filter the visible items by the search query */
  const filteredRoot = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORY_TAXONOMY;
    return CATEGORY_TAXONOMY.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  const filteredGroups = useMemo(() => {
    if (current.kind !== "node") return [];
    const q = query.trim().toLowerCase();
    if (!q) return current.node.groups;
    return current.node.groups.filter((g) => g.label.toLowerCase().includes(q));
  }, [current, query]);

  const filteredLeaves = useMemo(() => {
    if (current.kind !== "group") return [];
    const q = query.trim().toLowerCase();
    const leaves = groupLeafLabels(current.group);
    if (!q) return leaves;
    return leaves.filter((l) => l.toLowerCase().includes(q));
  }, [current, query]);

  if (!mounted) return null;

  const headerTitle =
    current.kind === "root"
      ? "Kategoritë"
      : current.kind === "node"
        ? current.node.label
        : current.group.label;

  return (
    <div
      ref={pageRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed",
        inset: 0,
        background: BG,
        display: "flex",
        flexDirection: "column",
        zIndex: 60,
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
        touchAction: "pan-y",
      }}
    >
      {/* Dark burgundy header */}
      <div
        style={{
          background: HEADER_BG,
          color: HEADER_INK,
          paddingTop: "env(safe-area-inset-top, 0px)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 12px 6px",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            aria-label={current.kind === "root" ? "Mbyll" : "Kthehu"}
            style={{
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              background: "transparent",
              border: "none",
              color: HEADER_INK,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ChevronLeft size={22} strokeWidth={1.8} />
          </button>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: 0.2,
              flex: 1,
              textAlign: "center",
              paddingRight: 36,
            }}
          >
            {headerTitle}
          </span>
        </div>

        {/* Gender tabs — only on the root level */}
        {current.kind === "root" && (
          <div
            style={{
              display: "flex",
              padding: "0 4px",
              gap: 4,
            }}
          >
            {GENDER_TABS.map((t) => {
              const active = gender === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setGender(t.key)}
                  style={{
                    flex: 1,
                    padding: "12px 4px 14px",
                    background: "transparent",
                    border: "none",
                    color: active ? HEADER_INK : HEADER_MUTED,
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: 0.2,
                    position: "relative",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {t.label}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 16,
                      right: 16,
                      bottom: 0,
                      height: 3,
                      borderRadius: 3,
                      background: active ? CORAL_GRADIENT : "transparent",
                      transition: "opacity 160ms ease",
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Search input */}
        <div style={{ padding: "10px 14px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <SearchIcon size={16} strokeWidth={1.8} color={HEADER_MUTED} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Çfarë kërkoni?"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: HEADER_INK,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          background: BG,
          paddingBottom: 96,
        }}
      >
        {current.kind === "root" && (
          <>
            {!query && (
              <>
                <Row
                  label="Trending"
                  onClick={navigateTrending}
                  IconLeft={Sparkles}
                  emphasize
                />
                <div
                  aria-hidden
                  style={{
                    height: 8,
                    background: "#f7f5f0",
                    borderTop: `1px solid ${DIVIDER}`,
                    borderBottom: `1px solid ${DIVIDER}`,
                  }}
                />
              </>
            )}
            {filteredRoot.map((node) => (
              <Row
                key={node.key}
                label={node.label}
                onClick={() => openNode(node)}
                IconLeft={NODE_ICON[node.key] ?? Tag}
              />
            ))}
          </>
        )}

        {current.kind === "node" && (
          <>
            <Row
              label={`Shiko të gjitha ${current.node.label.toLowerCase()}`}
              onClick={() => navigateToNode(current.node)}
              IconLeft={NODE_ICON[current.node.key] ?? Tag}
              emphasizeText
            />
            {filteredGroups.map((g) => {
              const hasChildren = !!g.children && g.children.length > 0;
              return (
                <Row
                  key={g.label}
                  label={g.label}
                  onClick={() =>
                    hasChildren
                      ? openGroup(current.node, g)
                      : navigateToLeaf(current.node, g.label)
                  }
                />
              );
            })}
          </>
        )}

        {current.kind === "group" && (
          <>
            <Row
              label={`Shiko të gjitha ${current.group.label.toLowerCase()}`}
              onClick={() => navigateToLeaf(current.node, current.group.label)}
              emphasizeText
            />
            {filteredLeaves.map((leaf) => (
              <Row
                key={leaf}
                label={leaf}
                onClick={() => navigateToLeaf(current.node, leaf)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                */
/* ------------------------------------------------------------------ */

function Row({
  label,
  onClick,
  IconLeft,
  emphasize,
  emphasizeText,
}: {
  label: string;
  onClick: () => void;
  IconLeft?: typeof Shirt;
  emphasize?: boolean;
  emphasizeText?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const outlet = emphasize && false; // reserved hook, unused
  void outlet;
  const iconColor = pressed ? CORAL_ACTIVE : INK;
  const chevColor = pressed ? CORAL_ACTIVE : CHEV;

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: 14,
        padding: "16px 18px",
        background: pressed ? "rgba(198,90,122,0.06)" : BG,
        border: "none",
        borderBottom: `1px solid ${DIVIDER}`,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        position: "relative",
      }}
    >
      {pressed && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: CORAL_GRADIENT,
          }}
        />
      )}
      {IconLeft && (
        <IconLeft
          size={22}
          strokeWidth={1.6}
          color={emphasize ? OUTLET_RED : iconColor}
        />
      )}
      <span
        style={{
          flex: 1,
          textAlign: "left",
          fontSize: 15,
          fontWeight: emphasizeText || emphasize ? 600 : 500,
          color: emphasize ? OUTLET_RED : INK,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </span>
      <ChevronRight size={18} strokeWidth={1.8} color={chevColor} />
    </button>
  );
}
