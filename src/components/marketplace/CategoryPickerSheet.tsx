import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

const BG = "#f6f1e7";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const CHIP = "#ede8de";
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
  const [draft, setDraft] = useState<CategorySelection>(() => cloneSelection(value));
  const [expanded, setExpanded] = useState<string | null>("mode");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(cloneSelection(value));
      setExpanded("mode");
      setExpandedGroup(null);
    }
  }, [open, value]);

  const toggleMain = (key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
    setExpandedGroup(null);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroup((prev) => (prev === id ? null : id));
  };

  const toggleAll = (node: CategoryNode) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      if (next.categories.has(node.key)) {
        next.categories.delete(node.key);
        // Also drop any subs for this node
        for (const s of [...next.subcategories]) {
          if (s.startsWith(`${node.key}::`)) next.subcategories.delete(s);
        }
      } else {
        next.categories.add(node.key);
        for (const s of [...next.subcategories]) {
          if (s.startsWith(`${node.key}::`)) next.subcategories.delete(s);
        }
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
        // Selecting an individual sub removes the "all-of" state
        next.categories.delete(nodeKey);
      }
      return next;
    });
  };

  const toggleGroupAll = (nodeKey: string, group: SubcategoryNode) => {
    setDraft((prev) => {
      const next = cloneSelection(prev);
      const leaves = groupLeafLabels(group);
      const allSelected = leaves.every((l) => next.subcategories.has(`${nodeKey}::${l}`));
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
    onOpenChange(false);
  };

  const nodeHasSelection = (node: CategoryNode) => {
    if (draft.categories.has(node.key)) return true;
    for (const s of draft.subcategories) if (s.startsWith(`${node.key}::`)) return true;
    return false;
  };

  const countSelectedIn = (node: CategoryNode) => {
    if (draft.categories.has(node.key)) return "Të gjitha";
    let n = 0;
    for (const s of draft.subcategories) if (s.startsWith(`${node.key}::`)) n += 1;
    return n > 0 ? String(n) : null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92dvh] flex-col border-0 p-0"
        style={{ backgroundColor: BG }}
      >
        {/* Drag handle (Radix sheet has its own close X; we hide it via css below) */}
        <style>{`.rroba-cat-sheet [data-radix-collection-item] { display: none; }`}</style>
        <div className="rroba-cat-sheet flex flex-col h-full">
          <div className="pt-3">
            <div
              className="mx-auto h-1.5 w-10 rounded-full"
              style={{ backgroundColor: "#c8c3b9" }}
            />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-center px-5 py-4">
            <h2 className="text-[17px] font-bold" style={{ color: INK }}>
              Kategoritë
            </h2>
            <button
              type="button"
              onClick={reset}
              className="absolute right-4 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: CHIP, color: INK }}
            >
              Rivendos
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto pb-4">
            {CATEGORY_TAXONOMY.map((node, i) => {
              const isOpen = expanded === node.key;
              const count = countSelectedIn(node);
              return (
                <div key={node.key}>
                  {i > 0 && (
                    <div className="h-px" style={{ backgroundColor: DIVIDER }} />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleMain(node.key)}
                    className="flex h-[52px] w-full items-center justify-between px-5"
                    style={{ backgroundColor: BG }}
                  >
                    <span className="text-[16px] font-bold" style={{ color: INK }}>
                      {node.label}
                    </span>
                    <span className="flex items-center gap-2">
                      {count && (
                        <span
                          className="grid min-w-[22px] h-[22px] place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
                          style={{ backgroundColor: CORAL }}
                        >
                          {count}
                        </span>
                      )}
                      <ChevronDown
                        className="h-5 w-5 transition-transform duration-200"
                        style={{
                          color: MUTED,
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-[max-height] duration-200 ease-out"
                    style={{ maxHeight: isOpen ? 4000 : 0 }}
                  >
                    <SubRow
                      label={`Të gjitha ${node.label.toLowerCase()}`}
                      indent
                      checked={draft.categories.has(node.key)}
                      onToggle={() => toggleAll(node)}
                    />
                    {node.groups.map((g) => {
                      const groupId = `${node.key}::${g.label}`;
                      const hasChildren = !!g.children && g.children.length > 0;
                      if (!hasChildren) {
                        const checked = draft.subcategories.has(`${node.key}::${g.label}`);
                        return (
                          <SubRow
                            key={groupId}
                            label={g.label}
                            indent
                            checked={checked || draft.categories.has(node.key)}
                            onToggle={() => toggleSub(node.key, g.label)}
                          />
                        );
                      }
                      const groupOpen = expandedGroup === groupId;
                      const leaves = groupLeafLabels(g);
                      const groupAllChecked =
                        draft.categories.has(node.key) ||
                        leaves.every((l) => draft.subcategories.has(`${node.key}::${l}`));
                      const anyChecked = leaves.some((l) =>
                        draft.subcategories.has(`${node.key}::${l}`),
                      );
                      return (
                        <div key={groupId}>
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupId)}
                            className="flex h-[48px] w-full items-center justify-between pl-9 pr-5"
                          >
                            <span
                              className="text-[15px] font-medium"
                              style={{ color: INK }}
                            >
                              {g.label}
                            </span>
                            <span className="flex items-center gap-2">
                              {(groupAllChecked || anyChecked) && (
                                <span
                                  className="grid min-w-[22px] h-[22px] place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
                                  style={{ backgroundColor: CORAL }}
                                >
                                  {groupAllChecked
                                    ? "Të gjitha"
                                    : leaves.filter((l) =>
                                        draft.subcategories.has(`${node.key}::${l}`),
                                      ).length}
                                </span>
                              )}
                              <ChevronDown
                                className="h-4 w-4 transition-transform duration-200"
                                style={{
                                  color: MUTED,
                                  transform: groupOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                }}
                              />
                            </span>
                          </button>
                          <div
                            className="overflow-hidden transition-[max-height] duration-200 ease-out"
                            style={{ maxHeight: groupOpen ? 2000 : 0 }}
                          >
                            <SubRow
                              label={`Të gjitha ${g.label.toLowerCase()}`}
                              indentDeep
                              checked={groupAllChecked}
                              onToggle={() => toggleGroupAll(node.key, g)}
                            />
                            {leaves.map((leaf) => (
                              <SubRow
                                key={`${groupId}::${leaf}`}
                                label={leaf}
                                indentDeep
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

          {/* Sticky done button */}
          <div
            className="px-5 pt-3 pb-6"
            style={{
              backgroundColor: BG,
              boxShadow: "0 -8px 16px -12px rgba(0,0,0,0.08)",
            }}
          >
            <button
              type="button"
              onClick={done}
              className="w-full rounded-full text-[16px] font-bold text-white"
              style={{ backgroundColor: CORAL, height: 56 }}
            >
              Gati{selectionCount(draft) > 0 ? ` (${selectionCount(draft)})` : ""}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SubRow({
  label,
  indent,
  indentDeep,
  checked,
  onToggle,
}: {
  label: string;
  indent?: boolean;
  indentDeep?: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-[48px] w-full items-center justify-between pr-5"
      style={{
        paddingLeft: indentDeep ? 56 : indent ? 36 : 20,
        backgroundColor: BG,
      }}
    >
      <span className="text-[15px]" style={{ color: INK }}>
        {label}
      </span>
      <span
        className="grid h-[22px] w-[22px] place-items-center rounded-[6px]"
        style={{
          backgroundColor: checked ? INK : "transparent",
          border: checked ? `1px solid ${INK}` : `1.5px solid ${CHECK_BORDER}`,
        }}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} color="#fff" />}
      </span>
    </button>
  );
}
