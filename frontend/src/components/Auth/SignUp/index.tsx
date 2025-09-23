"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Logo from "@/components/Layout/Header/Logo";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
import authService from "@/services/auth";

const SignUp = ({ onClose, onSwitchToSignIn }: { 
  onClose?: () => void;
  onSwitchToSignIn?: () => void;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    general: ""
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  // Password strength checking
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: "Very Weak", color: "text-red-400" };
      case 2: return { text: "Weak", color: "text-orange-400" };
      case 3: return { text: "Fair", color: "text-yellow-400" };
      case 4: return { text: "Good", color: "text-green-400" };
      case 5: return { text: "Strong", color: "text-green-500" };
      default: return { text: "", color: "" };
    }
  };

  const validateName = (name: string) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 50) return "Name must be less than 50 characters";
    return "";
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
    return "";
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      general: ""
    };

    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ name: "", email: "", password: "", general: "" });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      toast.success('Successfully registered! Redirecting to dashboard...');
      setLoading(false);
      
      // Close modal if onClose function is provided
      if (onClose) {
        onClose();
      }
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      setLoading(false);
      
      // Handle specific error cases
      const errorMessage = error.message || 'Registration failed';
      
      if (errorMessage.toLowerCase().includes('email already exists') ||
          errorMessage.toLowerCase().includes('user already exists') ||
          errorMessage.toLowerCase().includes('email is already taken')) {
        setErrors(prev => ({ ...prev, general: "An account with this email already exists. Please use a different email or try signing in." }));
      } else if (errorMessage.toLowerCase().includes('invalid email')) {
        setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      } else if (errorMessage.toLowerCase().includes('password') && 
                 errorMessage.toLowerCase().includes('weak')) {
        setErrors(prev => ({ ...prev, password: "Password is too weak. Please choose a stronger password." }));
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('connection')) {
        setErrors(prev => ({ ...prev, general: "Network error. Please check your connection and try again." }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="mb-4 p-3 rounded-md bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}
        
        <div className="mb-[22px]">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: "" }));
              }
            }}
            className={`w-full rounded-md border ${
              errors.name 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-dark_border border-opacity-60 focus:border-primary'
            } border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus-visible:shadow-none text-white dark:focus:border-primary`}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
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
            placeholder="Password (min 8 chars, include A-Z, a-z, 0-9)"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
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
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Strength:</span>
                <span className={`text-sm font-medium ${getPasswordStrengthText(getPasswordStrength(formData.password)).color}`}>
                  {getPasswordStrengthText(getPasswordStrength(formData.password)).text}
                </span>
              </div>
              <div className="flex space-x-1 mt-1">
                {[1,2,3,4,5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 w-full rounded ${
                      level <= getPasswordStrength(formData.password)
                        ? level <= 2 ? 'bg-red-400' : level <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>
        <div className="mb-9">
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.email || !formData.password}
            className="flex w-full items-center text-18 font-medium justify-center rounded-md bg-primary px-5 py-3 text-darkmode transition duration-300 ease-in-out hover:bg-transparent hover:text-primary border-primary border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign Up {loading && <Loader />}
          </button>
        </div>
      </form>

      <p className="text-body-secondary text-white text-base">
        Already have an account?
        {onSwitchToSignIn ? (
          <button 
            onClick={onSwitchToSignIn}
            className="pl-2 text-primary hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign In
          </button>
        ) : (
          <Link href="/" className="pl-2 text-primary hover:underline">
            Sign In
          </Link>
        )}
      </p>
    </>
  );
};

export default SignUp;
