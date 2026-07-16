import { useMemo, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCities, COUNTRY_ORDER, COUNTRY_LABEL, type City } from "@/hooks/useCities";

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2e2de";

export type CityPickerProps = {
  value: string | null | undefined; // city_id
  onChange: (cityId: string, city: City) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Visual variant for the trigger button */
  variant?: "field" | "chip";
};

export function CityPicker({
  value,
  onChange,
  placeholder = "Zgjidh qytetin",
  className,
  disabled,
  variant = "field",
}: CityPickerProps) {
  const { cities, loading } = useCities();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => cities.find((c) => c.id === value) ?? null,
    [cities, value],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, City[]>();
    for (const cc of COUNTRY_ORDER) map.set(cc, []);
    for (const city of cities) {
      const arr = map.get(city.country_code);
      if (arr) arr.push(city);
    }
    return COUNTRY_ORDER.map((cc) => ({ code: cc, cities: map.get(cc) ?? [] })).filter(
      (g) => g.cities.length > 0,
    );
  }, [cities]);

  const trigger = variant === "chip" ? (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${className ?? ""}`}
      style={{
        background: CARD,
        color: selected ? INK : MUTED,
        border: `1px solid ${DIVIDER}`,
      }}
    >
      <MapPin size={14} />
      <span>{selected?.name ?? placeholder}</span>
    </button>
  ) : (
    <button
      type="button"
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-2xl px-4 text-left text-[15px] transition disabled:opacity-60 ${className ?? ""}`}
      style={{
        background: CARD,
        color: selected ? INK : MUTED,
        height: 52,
      }}
    >
      <span className="truncate">{selected?.name ?? placeholder}</span>
      <ChevronDown size={18} style={{ color: MUTED }} />
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[calc(100vw-32px)] max-w-[380px] p-0 shadow-lg"
        style={{ background: CREAM, border: `1px solid ${DIVIDER}`, borderRadius: 16 }}
      >
        <Command
          style={{ background: CREAM }}
          filter={(itemValue, search) => {
            if (!search) return 1;
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <CommandInput
              placeholder="Kërko qytetin..."
              className="h-11 text-[15px]"
              style={{ color: INK }}
            />
          </div>
          <CommandList className="max-h-[320px]">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: MUTED }}>
                Duke ngarkuar...
              </div>
            ) : (
              <>
                <CommandEmpty
                  className="px-4 py-6 text-center text-sm"
                  style={{ color: MUTED }}
                >
                  Nuk u gjet asnjë qytet.
                </CommandEmpty>
                {grouped.map((group) => (
                  <CommandGroup
                    key={group.code}
                    heading={COUNTRY_LABEL[group.code]}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em]"
                  >
                    {group.cities.map((city) => {
                      const isSelected = selected?.id === city.id;
                      return (
                        <CommandItem
                          key={city.id}
                          value={`${city.name} ${COUNTRY_LABEL[city.country_code]}`}
                          onSelect={() => {
                            onChange(city.id, city);
                            setOpen(false);
                          }}
                          className="mx-1 my-0.5 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[15px] aria-selected:bg-[color:var(--picker-hover)]"
                          style={
                            {
                              color: INK,
                              // Tailwind color-arbitrary via css var so we don't ship raw palette
                              ["--picker-hover" as never]: "#e4dfd3",
                            } as React.CSSProperties
                          }
                        >
                          <span>{city.name}</span>
                          {isSelected && <Check size={16} style={{ color: INK }} />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
