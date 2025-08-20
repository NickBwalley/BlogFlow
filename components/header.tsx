"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 w-full p-2 sm:p-4 z-50">
      <header className="mx-auto max-w-[960px] bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between mx-0.5">
            {/* Logo and Brand */}
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative h-6 w-6 sm:h-8 sm:w-8">
                <Image
                  src="/images/favicon.png"
                  alt="BlogFlow Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">
                BlogFlow
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/blogs"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Blogs
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop Right Side Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Button
                  asChild
                  className="bg-primary text-white hover:bg-primary/90 font-medium"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-medium backdrop-blur-sm"
                  >
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-primary text-white hover:bg-primary/90 font-medium"
                  >
                    <Link href="/auth/sign-up">Sign up →</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden px-4 pb-4 border-t border-white/10 mt-4">
              <nav className="flex flex-col space-y-3 py-4">
                <Link
                  href="/blogs"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blogs
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                  {isAuthenticated ? (
                    <Button
                      asChild
                      className="bg-primary text-white hover:bg-primary/90 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-medium backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/auth/login">Sign in</Link>
                      </Button>
                      <Button
                        asChild
                        className="bg-primary text-white hover:bg-primary/90 font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/auth/sign-up">Sign up →</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
