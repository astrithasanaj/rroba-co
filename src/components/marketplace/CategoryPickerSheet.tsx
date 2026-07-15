import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, Check } from "lucide-react";
import {
  CATEGORY_TAXONOMY,
  cloneSelection,
  emptySelection,
  groupLeafLabels,
  selectionCount,
  type CategoryNode,
  type CategorySelection,
  type SubcategoryNode,
} from "@/lib/category-taxonomy";

const BG = "#ffffff";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const CHIP = "#ffffff";
const CHECK_BORDER = "#c8c3b9";
const CORAL = "#e8826a";

export function CategoryPickerSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: CategorySelection;
  onApply: (sel: CategorySelection) => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<CategorySelection>(() => cloneSelection(value));
  const [expanded, setExpanded] = useState<string | null>("mode");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Swipe-back
  const pageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  // Mount + slide-in animation
  useEffect(() => {
    if (open) {
      setMounted(true);
      setDraft(cloneSelection(value));
      setExpanded("mode");
      setExpandedGroup(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, value, mounted]);

  const close = () => onOpenChange(false);

  const onTouchStart = (e: React.TouchEvent) => {
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

  if (!mounted) return null;

  const toggleMain = (key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
    setExpandedGroup(null);
  };
  const toggleGroup = (id: string) =>
    setExpandedGroup((prev) => (prev === id ? null : id));

  const toggleAll = (node: CategoryNode) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      if (next.categories.has(node.key)) {
        next.categories.delete(node.key);
        for (const s of [...next.subcategories])
          if (s.startsWith(`${node.key}::`)) next.subcategories.delete(s);
      } else {
        next.categories.add(node.key);
        for (const s of [...next.subcategories])
          if (s.startsWith(`${node.key}::`)) next.subcategories.delete(s);
      }
      return next;
    });
  };
  const toggleSub = (nodeKey: string, label: string) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      const id = `${nodeKey}::${label}`;
      if (next.subcategories.has(id)) next.subcategories.delete(id);
      else {
        next.subcategories.add(id);
        next.categories.delete(nodeKey);
      }
      return next;
    });
  };
  const toggleGroupAll = (nodeKey: string, group: SubcategoryNode) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      const leaves = groupLeafLabels(group);
      const allSelected = leaves.every((l) =>
        next.subcategories.has(`${nodeKey}::${l}`),
      );
      leaves.forEach((l) => {
        const id = `${nodeKey}::${l}`;
        if (allSelected) next.subcategories.delete(id);
        else {
          next.subcategories.add(id);
          next.categories.delete(nodeKey);
        }
      });
      return next;
    });
  };

  const reset = () => setDraft(emptySelection());
  const done = () => {
    onApply(draft);
    close();
  };

  const countSelectedIn = (node: CategoryNode) => {
    if (draft.categories.has(node.key)) return "Të gjitha";
    let n = 0;
    for (const s of draft.subcategories) if (s.startsWith(`${node.key}::`)) n += 1;
    return n > 0 ? String(n) : null;
  };

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          background: BG,
          borderBottom: `1px solid ${DIVIDER}`,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Kthehu"
          style={{
            width: 36,
            height: 36,
            background: CHIP,
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color={INK} />
        </button>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: INK,
          }}
        >
          Kategoritë
        </span>
        <button
          type="button"
          onClick={reset}
          style={{
            background: CHIP,
            border: "none",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            color: INK,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Rivendos
        </button>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 160,
        }}
      >
        {CATEGORY_TAXONOMY.map((node, i) => {
          const isOpen = expanded === node.key;
          const count = countSelectedIn(node);
          return (
            <div key={node.key}>
              {i > 0 && <div style={{ height: 8, background: CHIP }} />}
              <button
                type="button"
                onClick={() => toggleMain(node.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "16px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: INK,
                  borderBottom: `1px solid ${DIVIDER}`,
                  background: BG,
                  border: "none",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span>{node.label}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {count && (
                    <span
                      style={{
                        background: CORAL,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    style={{
                      color: MUTED,
                      transition: "transform 200ms ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </span>
              </button>

              <div
                style={{
                  overflow: "hidden",
                  maxHeight: isOpen ? 4000 : 0,
                  transition: "max-height 220ms ease-out",
                }}
              >
                <SubRow
                  label={`Të gjitha ${node.label.toLowerCase()}`}
                  checked={draft.categories.has(node.key)}
                  onToggle={() => toggleAll(node)}
                />
                {node.groups.map((g) => {
                  const groupId = `${node.key}::${g.label}`;
                  const hasChildren = !!g.children && g.children.length > 0;
                  if (!hasChildren) {
                    const checked = draft.subcategories.has(
                      `${node.key}::${g.label}`,
                    );
                    return (
                      <SubRow
                        key={groupId}
                        label={g.label}
                        checked={checked || draft.categories.has(node.key)}
                        onToggle={() => toggleSub(node.key, g.label)}
                      />
                    );
                  }
                  const groupOpen = expandedGroup === groupId;
                  const leaves = groupLeafLabels(g);
                  const groupAllChecked =
                    draft.categories.has(node.key) ||
                    leaves.every((l) =>
                      draft.subcategories.has(`${node.key}::${l}`),
                    );
                  const anyChecked = leaves.some((l) =>
                    draft.subcategories.has(`${node.key}::${l}`),
                  );
                  return (
                    <div key={groupId}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupId)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "13px 20px 13px 32px",
                          fontSize: 14,
                          fontWeight: 500,
                          color: INK,
                          borderBottom: `1px solid ${DIVIDER}`,
                          background: BG,
                          border: "none",
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <span>{g.label}</span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {(groupAllChecked || anyChecked) && (
                            <span
                              style={{
                                background: CORAL,
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {groupAllChecked
                                ? "Të gjitha"
                                : leaves.filter((l) =>
                                    draft.subcategories.has(
                                      `${node.key}::${l}`,
                                    ),
                                  ).length}
                            </span>
                          )}
                          <ChevronDown
                            size={14}
                            style={{
                              color: MUTED,
                              transition: "transform 200ms ease",
                              transform: groupOpen
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          />
                        </span>
                      </button>
                      <div
                        style={{
                          overflow: "hidden",
                          maxHeight: groupOpen ? 2000 : 0,
                          transition: "max-height 220ms ease-out",
                        }}
                      >
                        <SubRow
                          label={`Të gjitha ${g.label.toLowerCase()}`}
                          deep
                          checked={groupAllChecked}
                          onToggle={() => toggleGroupAll(node.key, g)}
                        />
                        {leaves.map((leaf) => (
                          <SubRow
                            key={`${groupId}::${leaf}`}
                            label={leaf}
                            deep
                            checked={
                              draft.categories.has(node.key) ||
                              draft.subcategories.has(`${node.key}::${leaf}`)
                            }
                            onToggle={() => toggleSub(node.key, leaf)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apliko button — above nav bar */}
      <div
        style={{
          position: "fixed",
          bottom: 82,
          left: 16,
          right: 16,
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={done}
          style={{
            width: "100%",
            height: 52,
            background: CORAL,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.2px",
            boxShadow: "0 6px 20px -8px rgba(232,130,106,0.55)",
          }}
        >
          Apliko filtrat
          {selectionCount(draft) > 0 ? ` (${selectionCount(draft)})` : ""}
        </button>
      </div>
    </div>
  );
}

function SubRow({
  label,
  deep,
  checked,
  onToggle,
}: {
  label: string;
  deep?: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "13px 20px",
        paddingLeft: deep ? 48 : 32,
        fontSize: 14,
        fontWeight: 400,
        color: INK,
        borderBottom: `1px solid ${DIVIDER}`,
        background: BG,
        border: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: checked ? `1.5px solid ${INK}` : `1.5px solid ${CHECK_BORDER}`,
          background: checked ? INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 120ms ease",
        }}
      >
        {checked && <Check size={14} strokeWidth={3} color="#fff" />}
      </span>
    </button>
  );
}
