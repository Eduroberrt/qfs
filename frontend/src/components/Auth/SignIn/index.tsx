"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Logo from "@/components/Layout/Header/Logo"
import Loader from "@/components/Common/Loader";
import authService from "@/services/auth";
import ForgotPassword from "@/components/Auth/ForgotPassword";

const Signin = ({ onClose, onSwitchToSignUp }: { 
  onClose?: () => void;
  onSwitchToSignUp?: () => void;
}) => {
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: ""
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    checkboxToggle: false,
  });
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(loginData.email),
      password: validatePassword(loginData.password),
      general: ""
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const loginUser = async (e: any) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ email: "", password: "", general: "" });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login({
        email: loginData.email,
        password: loginData.password,
      });
      
      toast.success('Login successful! Redirecting to dashboard...');
      setLoading(false);
      
      // Close modal if onClose function is provided
      if (onClose) {
        onClose();
      }
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      setLoading(false);
      
      // Handle specific error cases
      const errorMessage = error.message || 'Login failed';
      
      if (errorMessage.toLowerCase().includes('invalid credentials') || 
          errorMessage.toLowerCase().includes('wrong password') ||
          errorMessage.toLowerCase().includes('incorrect password')) {
        setErrors(prev => ({ ...prev, general: "Invalid email or password. Please check your credentials and try again." }));
      } else if (errorMessage.toLowerCase().includes('user not found') ||
                 errorMessage.toLowerCase().includes('user does not exist')) {
        setErrors(prev => ({ ...prev, general: "No account found with this email address. Please check your email or sign up." }));
      } else if (errorMessage.toLowerCase().includes('account disabled') ||
                 errorMessage.toLowerCase().includes('account suspended')) {
        setErrors(prev => ({ ...prev, general: "Your account has been disabled. Please contact support." }));
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('connection')) {
        setErrors(prev => ({ ...prev, general: "Network error. Please check your connection and try again." }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
      
      toast.error(errorMessage);
    }
  };

  // Show ForgotPassword component if state is true
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onClose={onClose || (() => {})}
        onBackToSignIn={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <>
      <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <form onSubmit={loginUser}>
        {errors.general && (
          <div className="mb-4 p-3 rounded-md bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}
        
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => {
              setLoginData({ ...loginData, email: e.target.value });
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: "" }));
              }
            }}
            className={`w-full rounded-md border ${
              errors.email 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-dark_border border-opacity-60 focus:border-primary'
            } border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus-visible:shadow-none text-white dark:focus:border-primary`}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => {
              setLoginData({ ...loginData, password: e.target.value });
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: "" }));
              }
            }}
            className={`w-full rounded-md border ${
              errors.password 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-dark_border border-opacity-60 focus:border-primary'
            } border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus-visible:shadow-none text-white dark:focus:border-primary`}
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>
        <div className="mb-9">
          <button
            type="submit"
            disabled={loading || !loginData.email || !loginData.password}
            className="bg-primary w-full py-3 rounded-lg text-18 font-medium border border-primary hover:text-primary hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign In {loading && <Loader />}
          </button>
        </div>
      </form>

      <button
        onClick={() => setShowForgotPassword(true)}
        className="mb-2 inline-block text-base text-dark hover:text-primary text-white dark:hover:text-primary bg-transparent border-none cursor-pointer"
      >
        Forgot Password?
      </button>
      <p className="text-body-secondary text-white text-base">
        Not a member yet?{" "}
        {onSwitchToSignUp ? (
          <button 
            onClick={onSwitchToSignUp}
            className="text-primary hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign Up
          </button>
        ) : (
          <Link href="/" className="text-primary hover:underline">
            Sign Up
          </Link>
        )}
      </p>
    </>
  );
};

export default Signin;