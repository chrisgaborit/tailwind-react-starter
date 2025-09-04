// @ts-nocheck
import React, { useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";

// ✅ Logo served from /public
const LearnoLogo = "/learno-logo-dark.png";

const navLinkBase =
  "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors";
const navLinkInactive = "text-slate-300 hover:text-white hover:bg-slate-800";
const navLinkActive = "bg-slate-800 text-white shadow";

export default function AdminLayout() {
  const nav = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", end: true },
      { to: "/admin/users", label: "Users" },
      { to: "/admin/storyboards", label: "Storyboards" },
      { to: "/admin/billing", label: "Billing" },
      { to: "/admin/settings", label: "Settings" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 text-lg lg:text-xl flex flex-col lg:grid lg:grid-cols-[280px,1fr]">
      {/* Sidebar */}
      <aside className="border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 flex lg:flex-col">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
          <img src={LearnoLogo} alt="Learno" className="h-12 lg:h-14" />
          <span className="hidden lg:inline font-bold tracking-wide">
            Learno Admin
          </span>
        </div>

        <nav className="flex-1 px-4 lg:px-0 lg:pb-8 lg:space-y-1 flex lg:flex-col overflow-x-auto lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={(item as any).end}
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top header */}
        <header className="bg-slate-950/50 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Admin Panel
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">Hello, Admin</span>
            <button className="rounded-full bg-slate-800 hover:bg-slate-700 p-2">
              <span className="sr-only">Profile</span>
              <svg
                className="h-7 w-7 text-slate-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A9 9 0 1118.364 4.56a9 9 0 01-13.243 13.243z"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Routed content */}
        <section className="p-6 lg:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </section>
      </main>
    </div>
  );
}