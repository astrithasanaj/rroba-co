import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Sparkles, X } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

const adultSubs = [
  "Veshje",
  "Këpucë",
  "Çanta",
  "Aksesorë",
  "Vintage",
  "Designer",
];
const kidsSubs = ["Vajza", "Djem", "Këpucë", "Aksesorë"];

type Gender = "Femra" | "Meshkuj" | "Fëmijë";

function SellPage() {
  const [gender, setGender] = useState<Gender | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [photos, setPhotos] = useState<number[]>([1, 2]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-2xl">Shit një artikull</h1>
        <button className="text-xs font-medium text-muted-foreground">
          Ruaj draft
        </button>
      </header>

      <div className="space-y-6 px-5 pb-8">
        {/* Step 1 */}
        <section>
          <Label num={1}>Për kë është artikulli?</Label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["Femra", "Meshkuj", "Fëmijë"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGender(g);
                  setSub(null);
                }}
                className={`rounded-2xl border px-3 py-4 text-sm font-medium ${
                  gender === g
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2 */}
        {gender && (
          <section>
            <Label num={2}>Zgjidh nënkategorinë</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(gender === "Fëmijë" ? kidsSubs : adultSubs).map((s) => (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                    sub === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Photos */}
        <section>
          <Label num={3}>Foto</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Shto deri në 10 foto
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div
                key={p}
                className="relative aspect-square overflow-hidden rounded-2xl bg-secondary"
              >
                <img
                  src={`https://images.unsplash.com/photo-15${p}591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80`}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setPhotos(photos.filter((x) => x !== p))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setPhotos([...photos, photos.length + 1])}
              className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>

          <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/40 px-4 py-2 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Sugjero me AI
          </button>
        </section>

        {/* Fields */}
        <section className="space-y-4">
          <Field label="Titulli" placeholder="P.sh. Blazer i zi Zara" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marka" placeholder="Zara" />
            <Field label="Madhësia" placeholder="M" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gjendja" placeholder="Shumë i mirë" />
            <Field label="Ngjyra" placeholder="E zezë" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Çmimi (€)" placeholder="35" />
            <Field label="Qyteti" placeholder="Prishtinë" />
          </div>
          <Field label="Dorëzimi" placeholder="Personalisht / Postë" />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Përshkrimi
            </label>
            <textarea
              rows={4}
              placeholder="Shkruaj detaje për gjendjen, përmasat dhe materialin..."
              className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-foreground"
            />
          </div>
        </section>

        <PrimaryButton>Publiko artikullin</PrimaryButton>
      </div>
    </MobileShell>
  );
}

function Label({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">
        {num}
      </span>
      <h3 className="font-display text-xl">{children}</h3>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
      />
    </div>
  );
}
