import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const slides = [
  {
    title: "Shit rrobat që nuk i vesh më",
    body: "Pastro dollapin dhe fito para nga ato që nuk i vesh.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Gjej stilin tënd",
    body: "Marka, vintage dhe designer — me çmime që i bëjnë qejfin xhepit.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Bli dhe shit me lehtësi",
    body: "Bisedo, bëj ofertë dhe takohu lokalisht në Prishtinë.",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const slide = slides[i];
  const last = i === slides.length - 1;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
        <div className="flex items-center justify-between px-6 pt-6">
          <h1 className="font-display text-3xl">
            rroba<span className="text-accent">.</span>
          </h1>
          <button
            className="text-xs font-medium text-muted-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            Anashkalo
          </button>
        </div>

        <div className="mt-6 px-6">
          <div className="overflow-hidden rounded-[2rem] bg-secondary">
            <img
              src={slide.image}
              alt=""
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 px-8 text-center">
          <h2 className="font-display text-3xl leading-tight">{slide.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{slide.body}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-6 bg-foreground" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="mt-auto space-y-2 px-6 pb-10 pt-8">
          <PrimaryButton
            onClick={() => (last ? navigate({ to: "/" }) : setI(i + 1))}
          >
            {last ? "Fillo" : "Vazhdo"}
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={() => navigate({ to: "/" })}>
            Kam llogari
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
