"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignUp from "@/components/Auth/SignUp";
import authService from "@/services/auth";

const Platform = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const SignUpRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClickOutside = (event: MouseEvent) => {
    if (SignUpRef.current && !SignUpRef.current.contains(event.target as Node)) {
      setIsSignUpOpen(false);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleGetStartedClick = () => {
    // Always open signup modal, same as menu items
    setIsSignUpOpen(true);
  };

  useEffect(() => {
    if (isSignUpOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSignUpOpen]);

  useEffect(() => {
    document.body.style.overflow = isSignUpOpen ? "hidden" : "";
  }, [isSignUpOpen]);
  return (
    <section className="md:pt-44 sm:pt-24 pt-12 relative z-1">
      <div className="container mx-auto lg:max-w-screen-xl px-4">
        <div className="bg-section bg-opacity-10 px-16 py-14 rounded-3xl border-2 border-opacity-20 border-section grid grid-cols-12 items-center before:content-[''] before:absolute relative before:w-96 before:h-64 before:bg-start before:bg-no-repeat before:-bottom-11 overflow-hidden lg:before:right-48 before:-z-1 before:opacity-10 ">
          <div className="lg:col-span-8 col-span-12">
            <h2 className="text-white sm:text-40 text-30 mb-6">
              Hardware <span className="text-primary">Security</span>{" "}
              Integration
            </h2>
            <p className="text-muted text-opacity-60 text-18">
              Unlock the full Ledger experience by pairing the qfs-vault app with a Ledger hardware wallet. Our wallets are independently certified and designed to resist sophisticated cyber attacks.
            </p>
          </div>
          <div className="lg:col-span-4 col-span-12">
            <div className="flex lg:justify-end lg:mt-0 mt-7 justify-center">
              <button
                onClick={handleGetStartedClick}
                className="text-darkmode bg-primary border border-primary py-3 px-5 rounded-lg sm:text-21 text-18 font-medium hover:bg-transparent hover:text-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-tealGreen to-charcoalGray sm:w-50 w-96 sm:h-50 h-96 rounded-full sm:-bottom-80 bottom-0 blur-400 z-0 absolute sm:-left-48 opacity-60"></div>
      </div>

      {/* SignUp Modal */}
      {isSignUpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={SignUpRef}
            className="relative w-full max-w-md overflow-hidden rounded-lg px-8 pt-14 pb-8 text-center bg-dark_grey bg-opacity-90 backdrop-blur-md"
          >
            <button
              onClick={() => setIsSignUpOpen(false)}
              className="absolute top-0 right-0 mr-8 mt-8 text-white hover:text-primary"
              aria-label="Close SignUp Modal"
            >
              ✕
            </button>
            <SignUp onClose={() => setIsSignUpOpen(false)} />
          </div>
        </div>
      )}
    </section>
  );
};

export default Platform;
