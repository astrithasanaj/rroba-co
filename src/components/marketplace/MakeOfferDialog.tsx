import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MakeOfferDialog({
  open,
  onOpenChange,
  listingId,
  sellerId,
  buyerId,
  listingPrice,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingId: string;
  sellerId: string;
  buyerId: string | null;
  listingPrice: number;
}) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const num = Number(amount.replace(",", "."));
  const valid = Number.isFinite(num) && num > 0 && num < listingPrice * 5;

  const submit = async () => {
    if (!buyerId) {
      navigate({ to: "/auth" });
      return;
    }
    if (buyerId === sellerId) {
      toast.error("Nuk mund të bësh ofertë për artikullin tënd");
      return;
    }
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("offers").insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      amount: num,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Oferta u dërgua");
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bëj ofertë</DialogTitle>
          <DialogDescription>
            Çmimi i kërkuar: €{listingPrice}. Propozo një shifër që të duket e drejtë.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="offer">Oferta jote (€)</Label>
            <Input
              id="offer"
              type="number"
              inputMode="decimal"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(Math.max(1, Math.round(listingPrice * 0.8)))}
            />
          </div>
          <button
            type="button"
            disabled={!valid || submitting}
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Dërgo ofertën
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
