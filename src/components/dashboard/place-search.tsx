"use client";
import { Combobox } from "@base-ui/react/combobox";
import { type ComponentProps, useState } from "react";
import { inputClass } from "@/components/ui/input";
import { PLACE_SEARCH } from "@/configs/consts/place-search.const";
import type { PlaceSuggestion } from "@/configs/types/place-search.type";
import { usePlaceSearch } from "@/hooks/use-place-search";

type Props = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "onSelect"
> & {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
};
export function PlaceSearch({ value, onChange, onSelect, ...props }: Props) {
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const { items, loading, error } = usePlaceSearch(value, searching);
  return (
    <Combobox.Root
      items={items}
      open={open && searching && value.trim().length >= PLACE_SEARCH.minLength}
      onOpenChange={setOpen}
      filter={null}
      value={null}
      inputValue={value}
      itemToStringLabel={(item: PlaceSuggestion) => item.name}
      onInputValueChange={(text, details) => {
        if (details.reason === "input-change") {
          setSearching(true);
          setOpen(true);
          onChange(text);
        }
      }}
      onValueChange={(item) => {
        if (item) {
          setSearching(false);
          setOpen(false);
          onSelect(item);
        }
      }}
    >
      <Combobox.Input
        {...props}
        className={inputClass}
        autoComplete="off"
        maxLength={PLACE_SEARCH.maxLength}
      />
      <Combobox.Portal>
        <Combobox.Positioner
          sideOffset={4}
          className="z-[65] max-w-[calc(100vw-2rem)]"
        >
          <Combobox.Popup className="popup-motion max-h-64 w-(--anchor-width) overflow-y-auto rounded-xl border bg-surface p-1 text-sm shadow-md">
            <Combobox.Status className="block px-3 py-2 text-muted-foreground">
              {loading
                ? "Ищем места…"
                : error
                  ? "Поиск недоступен. Выберите место на карте."
                  : items.length === 0
                    ? "Места не найдены. Уточните название."
                    : "Выберите место"}
            </Combobox.Status>
            <Combobox.List>
              {(item: PlaceSuggestion) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  className="grid min-h-11 cursor-default gap-1 rounded-lg px-3 py-2 outline-none data-highlighted:bg-surface-hover"
                >
                  <span className="user-text">{item.name}</span>
                  <span className="user-text text-xs text-muted-foreground">
                    {item.address}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
