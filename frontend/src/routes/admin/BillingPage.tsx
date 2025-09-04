// @ts-nocheck
import Button from "@/components/ui/Button";

export default function BillingPage() {
  async function upgrade(priceId: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ priceId }),
    });
    const { url, error } = await res.json();
    if (error) {
      alert(error);
      return;
    }
    window.location.href = url;
  }

  async function openPortal() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/billing/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const { url, error } = await res.json();
    if (error) {
      alert(error);
      return;
    }
    window.location.href = url;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6 font-outfit text-[#E63946]">
        Billing
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold font-outfit mb-2 text-white">Pro</h2>
          <p className="text-slate-300 mb-4">For solo creators and small teams.</p>
          <div className="text-3xl font-bold mb-6">$29<span className="text-base font-normal text-slate-400">/mo</span></div>
          <Button size="lg" onClick={() => upgrade(import.meta.env.VITE_PRICE_PRO)}>
            Upgrade to Pro
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold font-outfit mb-2 text-white">Team</h2>
          <p className="text-slate-300 mb-4">Advanced collaboration and controls.</p>
          <div className="text-3xl font-bold mb-6">$99<span className="text-base font-normal text-slate-400">/mo</span></div>
          <Button size="lg" variant="secondary" onClick={() => upgrade(import.meta.env.VITE_PRICE_TEAM)}>
            Upgrade to Team
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={openPortal}>
          Open customer portal
        </Button>
      </div>
    </div>
  );
}