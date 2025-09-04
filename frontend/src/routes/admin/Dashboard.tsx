// @ts-nocheck
import Button from "@/components/ui/Button";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6 font-outfit text-[#0387E6]">
        Admin Dashboard
      </h1>
      <div className="text-lg text-slate-300 font-inter mb-6">
        Welcome! Use the sidebar to manage <span className="text-[#BC57CF]">users</span>,{" "}
        <span className="text-[#0387E6]">storyboards</span>,{" "}
        <span className="text-[#E63946]">billing</span>, and settings.
      </div>

      <div className="flex gap-3">
        <Button>Create Storyboard</Button>
        <Button variant="secondary">Invite User</Button>
        <Button variant="ghost">View Docs</Button>
      </div>
    </div>
  );
}