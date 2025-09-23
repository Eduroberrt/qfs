"use client";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import Image from "next/image";
import { getImagePrefix } from "@/utils/utils";
import toast from "react-hot-toast";
import Logo from "@/components/Layout/Header/Logo";

interface ForgotPasswordProps {
  onClose: () => void;
  onBackToSignIn: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose, onBackToSignIn }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset email sent successfully!");
      } else {
        setError(data.message || "Failed to send reset email");
        toast.error(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setIsSuccess(false);
    setError("");
    setEmail("");
    onBackToSignIn();
  };

  const handleResendEmail = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Reset email sent again!");
      } else {
        setError(data.message || "Failed to resend email");
        toast.error(data.message || "Failed to resend email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div>
        <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
          <Logo />
        </div>

        <div className="text-center">
          <div className="mb-6">
            <Icon
              icon="mdi:email-check"
              className="text-primary text-64 mx-auto"
            />
          </div>
          <h3 className="text-white text-24 font-medium mb-4">Check Your Email</h3>
          <p className="text-muted text-opacity-60 text-16 mb-6">
            We've sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          <p className="text-muted text-opacity-60 text-14 mb-8">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleResendEmail}
            disabled={isLoading}
            className="w-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-darkmode py-3 rounded-lg text-18 font-medium transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Resend Email"}
          </button>
          
          <button
            onClick={handleBackToSignIn}
            className="text-primary hover:underline bg-transparent border-none cursor-pointer text-16"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <h3 className="text-white text-24 font-medium text-center mb-6">Forgot Password?</h3>
      <p className="text-muted text-opacity-60 text-16 text-center mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-14">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="email" className="block text-white text-16 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary w-full py-3 rounded-lg text-18 font-medium border border-primary hover:text-primary hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="text-center">
        <button
          onClick={handleBackToSignIn}
          className="text-primary hover:underline bg-transparent border-none cursor-pointer text-16"
        >
          ← Back to Sign In
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-muted text-opacity-60 text-14">
          Remember your password?{" "}
          <Link href="/" className="text-primary hover:underline">
            Go to Homepage
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
