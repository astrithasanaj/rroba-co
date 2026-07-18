import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Shirt,
  Mountain,
  Archive,
  Frame,
  Speaker,
  Gamepad2,
  LayoutGrid,
  Venus,
  Mars,
  Baby,
} from "lucide-react";
import {
  CATEGORY_TAXONOMY,
  emptySelection,
  groupLeafLabels,
  type CategoryNode,
  type CategorySelection,
  type SubcategoryNode,
} from "@/lib/category-taxonomy";

const BG = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2e2de";
const HEADER_BG = "#2d1521";
const HEADER_TEXT = "#ffffff";
const ACCENT = "#c65a7a";
const ROW_ACTIVE_BG = "#fbf6f2";
const CHECK_BORDER = "#c8c3b9";
const ACCENT_GRADIENT = "linear-gradient(120deg, #e8836a, #c65a7a)";

const NODE_ICONS: Record<string, typeof Shirt> = {
  mode: Shirt,
  outdoor: Mountain,
  interior: Archive,
  art: Frame,
  elektronik: Speaker,
  hobi: Gamepad2,
};

const UNIVERSAL_KEYS = ["interior", "art", "elektronik", "hobi"];
const FEMIJE_KEY = "femije";

type Gender = "Femra" | "Meshkuj" | "Fëmijë";

type Level =
  | { kind: "root" }
  | { kind: "bucket" }
  | { kind: "groups"; node: CategoryNode }
  | { kind: "leaves"; node: CategoryNode; group: SubcategoryNode };

export function CategoryPickerSheet({
  open,
  onOpenChange,
  value,
  onApply,
  initialNodeKey,
  initialGroupLabel,
  initialBucket = false,
  gender = "Femra",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: CategorySelection;
  onApply: (sel: CategorySelection) => void;
  initialNodeKey?: string;
  initialGroupLabel?: string;
  initialBucket?: boolean;
  gender?: Gender;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const [leafDraft, setLeafDraft] = useState<Set<string>>(new Set());
  const [openedDirectly, setOpenedDirectly] = useState(false);
  const [openedAtLeaves, setOpenedAtLeaves] = useState(false);

  const femijeNode = CATEGORY_TAXONOMY.find((n) => n.key === FEMIJE_KEY)!;

  const pageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeafDraft(new Set());
      const startNode = initialNodeKey
        ? CATEGORY_TAXONOMY.find((n) => n.key === initialNodeKey)
        : undefined;
      const startGroup =
        startNode && initialGroupLabel
          ? startNode.groups.find((g) => g.label === initialGroupLabel)
          : undefined;
      if (startNode && startGroup) {
        setOpenedDirectly(true);
        setOpenedAtLeaves(true);
        setLevel({ kind: "leaves", node: startNode, group: startGroup });
      } else if (startNode) {
        setOpenedDirectly(true);
        setOpenedAtLeaves(false);
        setLevel({ kind: "groups", node: startNode });
      } else if (initialBucket && gender !== "Fëmijë") {
        setOpenedDirectly(false);
        setOpenedAtLeaves(false);
        setLevel({ kind: "bucket" });
      } else {
        setOpenedDirectly(false);
        setOpenedAtLeaves(false);
        setLevel({ kind: "root" });
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, mounted, initialNodeKey, initialGroupLabel, initialBucket, gender]);

  const close = () => onOpenChange(false);

  const goBack = () => {
    if (level.kind === "leaves") {
      if (openedAtLeaves) {
        close();
      } else if (level.node.key === FEMIJE_KEY) {
        if (openedDirectly) close();
        else setLevel({ kind: "root" });
      } else {
        setLevel({ kind: "groups", node: level.node });
      }
    } else if (level.kind === "groups") {
      if (openedDirectly && level.node.key === initialNodeKey) {
        close();
      } else if (UNIVERSAL_KEYS.includes(level.node.key)) {
        setLevel({ kind: "bucket" });
      } else {
        setLevel({ kind: "root" });
      }
    } else if (level.kind === "bucket") {
      setLevel({ kind: "root" });
    } else {
      close();
    }
  };

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
    if (dragging.current && dx > 80) goBack();
    dragging.current = false;
  };

  if (!mounted) return null;

  const applyAndClose = (sel: CategorySelection) => {
    onApply(sel);
    close();
  };

  const pickWholeNode = (node: CategoryNode) => {
    const sel = emptySelection();
    sel.categories.add(node.key);
    applyAndClose(sel);
  };

  const pickWholeGroup = (node: CategoryNode, group: SubcategoryNode) => {
    const sel = emptySelection();
    for (const leaf of groupLeafLabels(group)) {
      sel.subcategories.add(`${node.key}::${leaf}`);
    }
    applyAndClose(sel);
  };

  const pickLeaves = (node: CategoryNode, leaves: Set<string>) => {
    const sel = emptySelection();
    for (const leaf of leaves) sel.subcategories.add(`${node.key}::${leaf}`);
    applyAndClose(sel);
  };

  const toggleLeaf = (leaf: string) => {
    setLeafDraft((prev) => {
      const next = new Set(prev);
      if (next.has(leaf)) next.delete(leaf);
      else next.add(leaf);
      return next;
    });
  };

  const enterGroup = (node: CategoryNode, group: SubcategoryNode) => {
    const hasChildren = !!group.children && group.children.length > 0;
    if (hasChildren) {
      setLeafDraft(new Set());
      setLevel({ kind: "leaves", node, group });
    } else pickWholeGroup(node, group);
  };

  const title =
    level.kind === "root"
      ? "Kategoritë"
      : level.kind === "bucket"
        ? "Për të gjithë"
        : level.kind === "groups"
          ? level.node.label
          : level.group.label;

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px 12px",
          background: HEADER_BG,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label={level.kind === "root" ? "Mbyll" : "Kthehu"}
          className="transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color={HEADER_TEXT} strokeWidth={2} />
        </button>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: HEADER_TEXT,
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {level.kind === "root" && gender !== "Fëmijë" && (
          <RootList
            selection={value}
            onPickNode={(node) => setLevel({ kind: "groups", node })}
            onOpenBucket={() => setLevel({ kind: "bucket" })}
          />
        )}

        {level.kind === "root" && gender === "Fëmijë" && (
          <NodeGroupList
            node={femijeNode}
            onPickAll={() => pickWholeNode(femijeNode)}
            onPickGroup={(group) => enterGroup(femijeNode, group)}
          />
        )}

        {level.kind === "bucket" && (
          <BucketList onPickNode={(node) => setLevel({ kind: "groups", node })} />
        )}

        {level.kind === "groups" && (
          <NodeGroupList
            node={level.node}
            onPickAll={() => pickWholeNode(level.node)}
            onPickGroup={(group) => enterGroup(level.node, group)}
          />
        )}

        {level.kind === "leaves" && (
          <LeafList
            group={level.group}
            selected={leafDraft}
            onPickAll={() => pickWholeGroup(level.node, level.group)}
            onToggleLeaf={toggleLeaf}
          />
        )}
      </div>

      {level.kind === "leaves" && leafDraft.size > 0 && (
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
            onClick={() => pickLeaves(level.node, leafDraft)}
            style={{
              width: "100%",
              height: 52,
              background: ACCENT_GRADIENT,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.2px",
            }}
          >
            Apliko ({leafDraft.size})
          </button>
        </div>
      )}
    </div>
  );
}

function RootList({
  selection,
  onPickNode,
  onOpenBucket,
}: {
  selection: CategorySelection;
  onPickNode: (node: CategoryNode) => void;
  onOpenBucket: () => void;
}) {
  const genderSpecific = CATEGORY_TAXONOMY.filter(
    (n) => n.key !== FEMIJE_KEY && !UNIVERSAL_KEYS.includes(n.key),
  );
  return (
    <div>
      {genderSpecific.map((node) => {
        const Icon = NODE_ICONS[node.key];
        const active = selection.categories.has(node.key);
        return (
          <Row
            key={node.key}
            label={node.label}
            active={active}
            icon={
              Icon ? (
                <Icon
                  size={18}
                  strokeWidth={1.6}
                  color={active ? ACCENT : INK}
                />
              ) : undefined
            }
            onClick={() => onPickNode(node)}
          />
        );
      })}
      <Row
        label="Për të gjithë"
        icon={<LayoutGrid size={18} strokeWidth={1.6} color={INK} />}
        onClick={onOpenBucket}
      />
    </div>
  );
}

function BucketList({ onPickNode }: { onPickNode: (node: CategoryNode) => void }) {
  const universal = CATEGORY_TAXONOMY.filter((n) => UNIVERSAL_KEYS.includes(n.key));
  return (
    <div>
      {universal.map((node) => {
        const Icon = NODE_ICONS[node.key];
        return (
          <Row
            key={node.key}
            label={node.label}
            icon={Icon ? <Icon size={18} strokeWidth={1.6} color={INK} /> : undefined}
            onClick={() => onPickNode(node)}
          />
        );
      })}
    </div>
  );
}

const FEMIJE_GROUP_ICONS: Record<string, typeof Venus> = {
  Vajza: Venus,
  Djem: Mars,
  Bebe: Baby,
};

function NodeGroupList({
  node,
  onPickAll,
  onPickGroup,
}: {
  node: CategoryNode;
  onPickAll: () => void;
  onPickGroup: (group: SubcategoryNode) => void;
}) {
  const isFemije = node.key === FEMIJE_KEY;
  return (
    <div>
      <Row label={`Të gjitha ${node.label.toLowerCase()}`} bold onClick={onPickAll} />
      {node.groups.map((g) => {
        const Icon = isFemije ? FEMIJE_GROUP_ICONS[g.label] : undefined;
        return (
          <Row
            key={g.label}
            label={g.label}
            icon={Icon ? <Icon size={18} strokeWidth={1.6} color={INK} /> : undefined}
            onClick={() => onPickGroup(g)}
          />
        );
      })}
    </div>
  );
}

function LeafList({
  group,
  selected,
  onPickAll,
  onToggleLeaf,
}: {
  group: SubcategoryNode;
  selected: Set<string>;
  onPickAll: () => void;
  onToggleLeaf: (leaf: string) => void;
}) {
  const leaves = groupLeafLabels(group);
  return (
    <div style={{ paddingBottom: selected.size > 0 ? 100 : 0 }}>
      <Row label={`Të gjitha ${group.label.toLowerCase()}`} bold onClick={onPickAll} />
      {leaves.map((leaf) => (
        <CheckRow
          key={leaf}
          label={leaf}
          checked={selected.has(leaf)}
          onToggle={() => onToggleLeaf(leaf)}
        />
      ))}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
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
        gap: 12,
        width: "100%",
        padding: "14px 16px",
        fontSize: 14,
        fontWeight: checked ? 500 : 400,
        color: INK,
        background: checked ? ROW_ACTIVE_BG : BG,
        border: "none",
        borderBottom: `1px solid ${DIVIDER}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: checked ? "none" : `1.5px solid ${CHECK_BORDER}`,
          background: checked ? ACCENT : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && <Check size={14} strokeWidth={3} color="#fff" />}
      </span>
    </button>
  );
}

function Row({
  label,
  icon,
  bold,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  bold?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "14px 16px",
        fontSize: 14,
        fontWeight: bold || active ? 500 : 400,
        color: INK,
        background: active ? ROW_ACTIVE_BG : BG,
        border: "none",
        borderBottom: `1px solid ${DIVIDER}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight
        size={16}
        style={{ color: active ? ACCENT : MUTED, flexShrink: 0 }}
      />
    </button>
  );
}