"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FiChevronDown, FiLogIn, FiLogOut, FiMenu, FiUser, FiX } from "react-icons/fi";
import { GeistPixelSquare } from "geist/font/pixel";

export interface NavbarUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export interface NavbarProps {
  user?: NavbarUser | null;
  loading?: boolean;
  onSignOut?: () => void | Promise<void>;
}

const navItems = [
  { name: "Home", href: "/#home" },
  { name: "About", href: "/#about" },
  { name: "Timeline", href: "/#timeline" },
  { name: "Rules", href: "/#rules" },
  { name: "Bidding", href: "/bidding" },
  { name: "Teams", href: "/teams" },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ src, alt, name }: { src?: string | null; alt?: string; name?: string | null }) {
  return (
    <div className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[#42ff5a]/60 bg-zinc-950 text-[10px] font-bold text-[#42ff5a] shadow-[0_0_12px_rgba(66,255,90,0.25)]">
      {src ? (
        <img src={src} alt={alt || "Profile"} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

const PIXEL_FONT = "'Silkscreen', 'Press Start 2P', 'Pixelify Sans', 'GeistPixelSquare', monospace";

export function Navbar({ user, loading, onSignOut }: NavbarProps) {
  const auth = useAuth();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [isBrandOverdrive, setIsBrandOverdrive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: -200, y: -200 });
  const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);
  const resolvedUser = user ?? auth.user;
  const resolvedLoading = loading ?? auth.loading;
  const resolvedOnSignOut = onSignOut ?? auth.signOut;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash || "#home");
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    if (pathname === "/") {
      const sectionIds = ["home", "about", "timeline", "rules"];
      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (sections.length > 0) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setCurrentHash(`#${entry.target.id}`);
              }
            });
          },
          { threshold: 0.3 }
        );

        sections.forEach((section) => observer.observe(section));

        return () => {
          sections.forEach((section) => observer.unobserve(section));
          window.removeEventListener("hashchange", updateHash);
          window.removeEventListener("popstate", updateHash);
        };
      }
    }

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      const targetHash = href.replace("/", "");
      if (pathname !== "/") return false;
      if (targetHash === "#home") {
        return !currentHash || currentHash === "#home";
      }
      return currentHash === targetHash;
    }
    return href === "/"
      ? pathname === "/" && (!currentHash || currentHash === "#home")
      : pathname.startsWith(href);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header
      ref={navRef}
      data-hero-navbar
      className={`${GeistPixelSquare.variable} ${GeistPixelSquare.className} fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10 transition-all duration-300 ${
        isBrandOverdrive ? "hg-brand-overdrive" : ""
      }`}
      style={{
        fontFamily: PIXEL_FONT,
        "--font-geist-pixel": PIXEL_FONT,
        "--font-geist-pixel-square": PIXEL_FONT,
      } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[1440px]">
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            setIsSpotlightVisible(true);
          }}
          onMouseLeave={() => setIsSpotlightVisible(false)}
          className={`hg-nav-shell group relative z-10 overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 px-4 sm:px-8 backdrop-blur-2xl ${
            isScrolled
              ? "border-[#42ff5a]/30 bg-black/85 shadow-[0_28px_80px_rgba(0,0,0,0.6),0_0_30px_rgba(66,255,90,0.10),inset_0_1px_0_rgba(255,255,255,0.2)]"
              : "border-white/15 bg-white/[0.07] shadow-[0_24px_70px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.16)]"
          } ${isBrandOverdrive ? "hg-brand-overdrive" : ""}`}
        >
          {/* Interactive Mouse Spotlight Tracker */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
            style={{
              opacity: isSpotlightVisible ? 1 : 0,
              background: `radial-gradient(350px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(66, 255, 90, 0.16), rgba(66, 255, 90, 0.03) 45%, transparent 80%)`,
            }}
          />

          <div aria-hidden="true" className="hg-atmosphere pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(66,255,90,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(66,255,90,0.12),transparent_35%)]" />
          <div aria-hidden="true" className="hg-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex h-18 sm:h-20 items-center justify-between gap-4 sm:gap-6">
            <Link
              href="/"
              onMouseEnter={() => {
                setIsBrandOverdrive(true);
                document.dispatchEvent(new Event("hackgrid-brand-focus"));
              }}
              onMouseLeave={() => {
                setIsBrandOverdrive(false);
                document.dispatchEvent(new Event("hackgrid-brand-blur"));
              }}
              className="group/brand flex shrink-0 items-center transition-all duration-200 hover:scale-105"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: "1.05rem",
                color: "#42ff5a",
                letterSpacing: "0.10em",
                textShadow: "0 0 12px rgba(66, 255, 90, 0.65), 0 0 24px rgba(66, 255, 90, 0.35)",
              }}
            >
              <span className="hg-glitch-text font-bold tracking-wider" data-glitch="HackGrid">HackGrid</span>
            </Link>

            <nav aria-label="Primary navigation" className="hidden items-center gap-1.5 lg:ml-auto lg:mr-4 lg:flex">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      document.dispatchEvent(
                        new CustomEvent("hackgrid-nav-focus", {
                          detail: {
                            name: item.name,
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                          },
                        }),
                      );
                    }}
                    onFocus={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      document.dispatchEvent(
                        new CustomEvent("hackgrid-nav-focus", {
                          detail: {
                            name: item.name,
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                          },
                        }),
                      );
                    }}
                    onPointerLeave={() => document.dispatchEvent(new Event("hackgrid-nav-blur"))}
                    className={`hg-nav-link group relative rounded-full px-5 py-2.5 text-xs font-medium tracking-[-0.01em] transition ${
                      active
                        ? "text-[#42ff5a]"
                        : "text-zinc-300"
                    }`}
                    style={{
                      fontFamily: PIXEL_FONT,
                      fontSize: "0.66rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span className="hg-glitch-text relative z-10" data-glitch={item.name}>{item.name}</span>
                    {active ? (
                      <span className="absolute inset-0 rounded-full border border-[#42ff5a]/25 bg-[radial-gradient(circle_at_top,rgba(66,255,90,0.12),rgba(66,255,90,0.02)_70%,transparent_100%)] shadow-[inset_0_0_12px_rgba(66,255,90,0.06)]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <span className="hidden h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent xl:block" />
              {resolvedLoading ? (
                <div className="h-10 w-10 animate-pulse rounded-full border border-[#42ff5a]/20 bg-zinc-800/80" />
              ) : resolvedUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((open) => !open)}
                    className={`group/user flex items-center gap-2.5 rounded-full border transition-all duration-200 p-1.5 pr-3.5 text-[#42ff5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42ff5a] ${
                      isAccountMenuOpen
                        ? "border-[#42ff5a] bg-[#42ff5a]/15 shadow-[0_0_20px_rgba(66,255,90,0.25)]"
                        : "border-[#42ff5a]/50 bg-gradient-to-r from-[#42ff5a]/12 to-[#42ff5a]/5 shadow-[0_0_14px_rgba(66,255,90,0.12)] hover:border-[#42ff5a]/80 hover:bg-[#42ff5a]/15 hover:shadow-[0_0_20px_rgba(66,255,90,0.2)]"
                    }`}
                    aria-label="Open user menu"
                    aria-expanded={isAccountMenuOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar src={resolvedUser.photoURL} alt={resolvedUser.displayName || "User"} name={resolvedUser.displayName} />
                    <span className="hidden font-semibold tracking-[0.04em] sm:inline" style={{ fontFamily: PIXEL_FONT, fontSize: "0.62rem" }}>{resolvedUser.displayName || "User"}</span>
                    <FiChevronDown className={`size-3.5 transition-transform duration-200 ${isAccountMenuOpen ? "rotate-180 text-[#42ff5a]" : "text-[#42ff5a]/70 group-hover/user:text-[#42ff5a]"}`} />
                  </button>

                  {isAccountMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-[#42ff5a]/30 bg-black/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(66,255,90,0.12)] backdrop-blur-2xl" role="menu">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={resolvedUser.photoURL} alt={resolvedUser.displayName || "User"} name={resolvedUser.displayName} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="truncate text-xs font-semibold text-white" style={{ fontFamily: PIXEL_FONT, fontSize: "0.62rem" }}>{resolvedUser.displayName || "User"}</p>
                              <span className="rounded bg-[#42ff5a]/15 px-1.5 py-0.5 font-bold tracking-widest text-[#42ff5a] border border-[#42ff5a]/30" style={{ fontFamily: PIXEL_FONT, fontSize: "0.48rem" }}>ONLINE</span>
                            </div>
                            <p className="truncate text-zinc-400 mt-0.5" style={{ fontFamily: PIXEL_FONT, fontSize: "0.52rem" }}>{resolvedUser.email || "No email"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <button type="button" className="group/item flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-all hover:border-[#42ff5a]/30 hover:bg-[#42ff5a]/10 hover:text-[#42ff5a]" role="menuitem" style={{ fontFamily: PIXEL_FONT, fontSize: "0.60rem" }}>
                          <FiUser className="size-3.5 text-[#42ff5a]/70 group-hover/item:text-[#42ff5a]" />
                          <span>User Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            void resolvedOnSignOut();
                          }}
                          className="group/item flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-left text-xs font-medium text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/12 hover:text-red-300"
                          role="menuitem"
                          style={{ fontFamily: PIXEL_FONT, fontSize: "0.60rem" }}
                        >
                          <FiLogOut className="size-3.5 text-red-400/80 group-hover/item:text-red-300" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hg-login-button group/login relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#42ff5a]/60 bg-[#42ff5a]/10 px-4 py-2 text-xs text-[#42ff5a] shadow-[0_0_18px_rgba(66,255,90,0.12)] transition"
                  style={{
                    fontFamily: PIXEL_FONT,
                    fontSize: "0.60rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  <span className="hg-login-scan" aria-hidden="true" />
                  <span className="hg-login-icon relative z-10 grid size-5 place-items-center rounded-full border border-[#42ff5a]/35 bg-[#42ff5a]/10">
                    <FiLogIn className="size-3.5" />
                  </span>
                  <span className="hg-login-label relative z-10" data-label="LOGIN">LOGIN</span>
                  <span className="hg-login-enter relative z-10 tracking-[0.12em] text-[#42ff5a]/55" style={{ fontFamily: PIXEL_FONT, fontSize: "0.50rem" }}>ENTER</span>
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.08] text-[#42ff5a] shadow-[0_0_14px_rgba(0,0,0,0.18)] transition hover:border-[#42ff5a]/50 hover:bg-[#42ff5a]/10 lg:hidden"
            >
              {isMenuOpen ? <FiX className="size-4" /> : <FiMenu className="size-4" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="hg-mobile-panel relative mt-3 overflow-hidden rounded-2xl border border-[#42ff5a]/25 bg-black/90 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_24px_rgba(66,255,90,0.08)] backdrop-blur-2xl lg:hidden"
            >
              <div aria-hidden="true" className="hg-grid pointer-events-none absolute inset-0 opacity-15" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-[#42ff5a]/10 blur-2xl" />
              <div className="relative z-10 grid gap-1.5">
                {navItems.map((item, idx) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`hg-mobile-link group/item flex items-center justify-between rounded-xl border px-4 py-3 font-medium transition-all ${
                        active
                          ? "border-[#42ff5a]/60 bg-[#42ff5a]/12 text-[#42ff5a] shadow-[0_0_16px_rgba(66,255,90,0.14)]"
                          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-[#42ff5a]/35 hover:bg-[#42ff5a]/8 hover:text-[#42ff5a]"
                      }`}
                      style={{
                        fontFamily: PIXEL_FONT,
                        fontSize: "0.68rem",
                        letterSpacing: "0.06em",
                        animation: "hg-mobile-item-enter 220ms ease-out both",
                        animationDelay: `${idx * 40}ms`,
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 rounded-full transition-all ${active ? "bg-[#42ff5a] shadow-[0_0_8px_rgba(66,255,90,0.9)]" : "bg-white/30 group-hover/item:bg-[#42ff5a]"}`} />
                        <span className="hg-glitch-text" data-glitch={item.name}>{item.name}</span>
                      </span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: "0.52rem", color: active ? "#42ff5a" : undefined }}>
                        {active ? "ACTIVE" : "→"}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="relative z-10 mt-3.5 border-t border-white/10 pt-3.5">
                {resolvedLoading ? (
                  <div className="h-10 animate-pulse rounded-xl border border-[#42ff5a]/20 bg-zinc-900/80" />
                ) : resolvedUser ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#42ff5a]/30 bg-white/[0.04] p-3 shadow-[0_0_16px_rgba(66,255,90,0.08)]">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={resolvedUser.photoURL} alt={resolvedUser.displayName || "User"} name={resolvedUser.displayName} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-white" style={{ fontFamily: PIXEL_FONT, fontSize: "0.62rem" }}>{resolvedUser.displayName || "User"}</p>
                          <span className="rounded bg-[#42ff5a]/15 px-1 py-0.2 font-bold text-[#42ff5a] border border-[#42ff5a]/30" style={{ fontFamily: PIXEL_FONT, fontSize: "0.48rem" }}>ONLINE</span>
                        </div>
                        <p className="truncate text-zinc-400 mt-0.5" style={{ fontFamily: PIXEL_FONT, fontSize: "0.52rem" }}>{resolvedUser.email || "No email"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void resolvedOnSignOut();
                      }}
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-red-400/40 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/70"
                      aria-label="Log out"
                    >
                      <FiLogOut className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="hg-login-button group/login relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#42ff5a]/60 bg-[#42ff5a]/10 px-4 py-2.5 text-xs text-[#42ff5a] shadow-[0_0_18px_rgba(66,255,90,0.12)] transition"
                    style={{
                      fontFamily: PIXEL_FONT,
                      fontSize: "0.60rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <span className="hg-login-scan" aria-hidden="true" />
                    <span className="hg-login-icon relative z-10 grid size-5 place-items-center rounded-full border border-[#42ff5a]/35 bg-[#42ff5a]/10">
                      <FiLogIn className="size-3.5" />
                    </span>
                    <span className="hg-login-label relative z-10" data-label="LOGIN">LOGIN</span>
                    <span className="hg-login-enter relative z-10 tracking-[0.12em] text-[#42ff5a]/55" style={{ fontFamily: PIXEL_FONT, fontSize: "0.50rem" }}>ENTER</span>
                  </Link>
                )}
              </div>
            </nav>
        )}

        <style jsx>{`
          :global([data-hero-navbar]),
          :global([data-hero-navbar] *),
          :global([data-hero-navbar] a),
          :global([data-hero-navbar] a *),
          :global([data-hero-navbar] button),
          :global([data-hero-navbar] span),
          :global([data-hero-navbar] p),
          :global([data-hero-navbar] ::before),
          :global([data-hero-navbar] ::after) {
            font-family: 'Silkscreen', 'Press Start 2P', 'Pixelify Sans', 'GeistPixelSquare', monospace !important;
          }

          :global(main > header[data-hero-navbar]) {
            display: none;
          }

          .hg-nav-shell {
            animation: hg-nav-enter 220ms ease-out both;
            clip-path: inset(0 round 24px);
          }

          .hg-atmosphere {
            animation: hg-atmosphere-breathe 7s ease-in-out infinite;
          }

          .hg-grid {
            background-image: linear-gradient(rgba(0, 255, 157, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.06) 1px, transparent 1px);
            background-size: 22px 22px;
            mask-image: linear-gradient(90deg, black, transparent 42%, transparent 58%, black);
          }

          .hg-nav-shell.hg-brand-overdrive {
            animation: hg-brand-shell-surge 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
            border-color: rgba(0, 255, 157, 0.72);
            background: rgba(0, 255, 157, 0.13);
            transform: scale(1.012);
            transition: background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
            box-shadow: 0 0 36px rgba(0, 255, 157, 0.35), 0 28px 90px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .hg-nav-shell.hg-brand-overdrive .hg-atmosphere {
            animation: hg-brand-atmosphere-surge 720ms ease-out both;
          }

          .hg-nav-shell.hg-brand-overdrive .hg-grid {
            animation: hg-grid-surge 720ms ease-out both;
          }

          .hg-nav-shell.hg-brand-overdrive .hg-nav-link {
            animation: hg-nav-link-surge 520ms ease-out both;
          }

          .hg-nav-shell.hg-brand-overdrive .hg-nav-link:nth-child(2) { animation-delay: 35ms; }
          .hg-nav-shell.hg-brand-overdrive .hg-nav-link:nth-child(3) { animation-delay: 70ms; }
          .hg-nav-shell.hg-brand-overdrive .hg-nav-link:nth-child(4) { animation-delay: 105ms; }
          .hg-nav-shell.hg-brand-overdrive .hg-nav-link:nth-child(5) { animation-delay: 140ms; }
          .hg-nav-shell.hg-brand-overdrive .hg-nav-link:nth-child(6) { animation-delay: 175ms; }

          /* Inspiration 4: exact nav-item hover underline */
          :global(.hg-nav-link) {
            position: relative;
            color: #d4d4d8;
            text-decoration: none;
            border: 1px solid transparent;
            transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
          }

          :global(.hg-nav-link)::before {
            content: "";
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 4px;
            height: 1px;
            background: #00ff9d;
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 200ms ease;
            box-shadow: 0 0 8px #00ff9d;
            pointer-events: none;
            z-index: 20;
          }

          :global(.hg-glitch-text) {
            position: relative;
            display: inline-block;
          }

          :global(.hg-glitch-text)::before,
          :global(.hg-glitch-text)::after {
            position: absolute;
            inset: 0;
            content: attr(data-glitch);
            opacity: 0;
            pointer-events: none;
            clip-path: inset(0 0 100% 0);
          }

          :global(.hg-glitch-text)::before {
            color: #ff3070;
            text-shadow: -2px 0 #ff3070;
          }

          :global(.hg-glitch-text)::after {
            color: #00dcff;
            text-shadow: 2px 0 #00dcff;
          }

          :global(.hg-nav-link:hover .hg-glitch-text)::before,
          :global(.hg-nav-link:focus-visible .hg-glitch-text)::before,
          .hg-nav-shell.hg-brand-overdrive .hg-glitch-text::before {
            animation: hg-text-glitch-red 900ms steps(2, end) infinite;
          }

          :global(.hg-nav-link:hover .hg-glitch-text)::after,
          :global(.hg-nav-link:focus-visible .hg-glitch-text)::after,
          .hg-nav-shell.hg-brand-overdrive .hg-glitch-text::after {
            animation: hg-text-glitch-cyan 900ms steps(2, end) 90ms infinite;
          }

          :global(.hg-nav-link:hover) {
            color: #42ff5a !important;
            background: rgba(66, 255, 90, 0.12);
            border-color: rgba(66, 255, 90, 0.45);
            box-shadow: 0 0 18px rgba(66, 255, 90, 0.16), inset 0 0 14px rgba(66, 255, 90, 0.08);
            text-shadow: 0 0 10px rgba(66, 255, 90, 0.55);
            transform: translateY(-1px);
          }

          :global(.hg-nav-link:focus-visible) {
            color: #42ff5a !important;
            border-color: rgba(66, 255, 90, 0.65);
            outline: 2px solid rgba(66, 255, 90, 0.4);
            outline-offset: 2px;
          }

          :global(.hg-mobile-link) {
            transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          }

          :global(.hg-mobile-link:hover),
          :global(.hg-mobile-link:focus-visible) {
            border-color: rgba(66, 255, 90, 0.45);
            background: rgba(66, 255, 90, 0.12);
            color: #42ff5a;
            box-shadow: 0 0 18px rgba(66, 255, 90, 0.14), inset 0 0 14px rgba(66, 255, 90, 0.08);
            transform: translateX(4px);
          }

          :global(.hg-login-button) {
            isolation: isolate;
            border-color: rgba(66, 255, 90, 0.62);
            background: linear-gradient(135deg, rgba(66, 255, 90, 0.15), rgba(66, 255, 90, 0.04));
            box-shadow: 0 0 22px rgba(66, 255, 90, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18);
            transition: color 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          }

          :global(.hg-login-scan) {
            position: absolute;
            inset: 0;
            background: linear-gradient(105deg, transparent 25%, rgba(255, 255, 255, 0.22) 45%, transparent 65%);
            transform: translateX(-120%);
            transition: transform 500ms ease;
          }

          :global(.hg-login-icon) {
            transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
          }

          :global(.hg-login-enter) {
            opacity: 0.7;
            transform: translateX(0);
            transition: opacity 180ms ease, transform 180ms ease;
          }

          :global(.hg-login-button:hover),
          :global(.hg-login-button:focus-visible) {
            color: #06130e;
            border-color: rgba(66, 255, 90, 0.95);
            background: #42ff5a;
            box-shadow: 0 0 30px rgba(66, 255, 90, 0.3), inset 0 0 18px rgba(255, 255, 255, 0.22);
            transform: translateY(-1px);
          }

          :global(.hg-login-button:hover) .hg-login-scan,
          :global(.hg-login-button:focus-visible) .hg-login-scan {
            transform: translateX(120%);
          }

          :global(.hg-login-button:hover) .hg-login-icon,
          :global(.hg-login-button:focus-visible) .hg-login-icon {
            background: rgba(6, 19, 14, 0.12);
            box-shadow: 0 0 12px rgba(6, 19, 14, 0.18);
            transform: translateX(2px) rotate(-8deg);
          }

          :global(.hg-login-button:hover) .hg-login-enter,
          :global(.hg-login-button:focus-visible) .hg-login-enter {
            opacity: 0.9;
            transform: translateX(2px);
          }

          :global(.hg-login-button:focus-visible) {
            outline: 2px solid rgba(66, 255, 90, 0.55);
            outline-offset: 3px;
          }

          :global(.hg-nav-link:hover)::before,
          :global(.hg-nav-link:focus-visible)::before {
            transform: scaleX(1);
          }

          .hg-mobile-panel {
            animation: hg-mobile-enter 160ms ease-out both;
          }

          @keyframes hg-nav-enter {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes hg-mobile-enter {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes hg-mobile-item-enter {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes hg-atmosphere-breathe {
            0%, 100% { opacity: 0.72; }
            50% { opacity: 1; }
          }

          @keyframes hg-brand-shell-surge {
            0% { box-shadow: 0 28px 80px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16); }
            45% { box-shadow: 0 0 34px rgba(66, 255, 90, 0.34), 0 28px 90px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
            100% { box-shadow: 0 28px 80px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16); }
          }

          @keyframes hg-brand-atmosphere-surge {
            0% { opacity: 0.72; transform: scale(1); }
            45% { opacity: 1; transform: scale(1.25); }
            100% { opacity: 0.72; transform: scale(1); }
          }

          @keyframes hg-grid-surge {
            0%, 100% { opacity: 0.2; }
            45% { opacity: 0.65; }
          }

          @keyframes hg-nav-link-surge {
            0%, 100% { transform: translateY(0); color: rgb(212, 212, 216); }
            45% { transform: translateY(-3px); color: rgb(66, 255, 90); text-shadow: 0 0 12px rgba(66, 255, 90, 0.65); }
          }

          @keyframes hg-text-glitch-red {
            0% { opacity: 0; clip-path: inset(0 0 100% 0); transform: translateX(0); }
            20% { opacity: 1; clip-path: inset(8% 0 62% 0); transform: translateX(-5px); }
            40% { opacity: 0.3; clip-path: inset(35% 0 40% 0); transform: translateX(2px); }
            55% { opacity: 0.85; clip-path: inset(64% 0 14% 0); transform: translateX(6px); }
            75% { opacity: 0.2; clip-path: inset(85% 0 4% 0); transform: translateX(-3px); }
            100% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateX(0); }
          }

          @keyframes hg-text-glitch-cyan {
            0% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateX(0); }
            22% { opacity: 1; clip-path: inset(44% 0 32% 0); transform: translateX(5px); }
            42% { opacity: 0.3; clip-path: inset(20% 0 60% 0); transform: translateX(-2px); }
            60% { opacity: 0.85; clip-path: inset(4% 0 78% 0); transform: translateX(-6px); }
            80% { opacity: 0.2; clip-path: inset(0 0 96% 0); transform: translateX(3px); }
            100% { opacity: 0; clip-path: inset(0 0 100% 0); transform: translateX(0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .hg-nav-shell,
            .hg-atmosphere,
            .hg-mobile-panel,
            :global(.hg-glitch-text)::before,
            :global(.hg-glitch-text)::after,
            :global(.hg-login-button),
            :global(.hg-login-scan),
            :global(.hg-login-icon),
            :global(.hg-login-enter),
            .hg-nav-shell.hg-brand-overdrive,
            .hg-brand-overdrive .hg-atmosphere,
            .hg-brand-overdrive .hg-grid,
            .hg-brand-overdrive .hg-nav-link { animation: none; }
            .hg-nav-link,
            .hg-nav-link::before { transition: none; }
          }
        `}</style>
      </div>
    </header>
  );
}

export default Navbar;
