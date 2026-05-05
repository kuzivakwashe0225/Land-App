import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";
import { CheckCircle, AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import toast from 'react-hot-toast';

function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    nationalId: "",
    role: "BUYER",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [successEmail, setSuccessEmail] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendLoading, setResendLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const navigate = useNavigate();

  // Password validation — mirrors backend rules exactly
  const validatePassword = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  });

  // Get live password validation status
  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password]);

  // Password is valid only when ALL core requirements met
  const isPasswordValid = passwordValidation.length && passwordValidation.uppercase && passwordValidation.number;

  // Form can only be submitted when all fields filled and password valid
  const isFormValid = formData.firstName && formData.lastName && formData.email &&
                      formData.phoneNumber && formData.nationalId && isPasswordValid;

  async function submitHandler(event) {
    event.preventDefault();

    if (!isPasswordValid) {
      const msg = 'Please ensure your password meets all requirements before submitting.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setServerErrors({});

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        // Handle field-specific errors from server
        if (data.errors && typeof data.errors === 'object') {
          setServerErrors(data.errors);
          // Show the first error as main error message
          const errorFields = Object.keys(data.errors);
          const firstError = data.errors[errorFields[0]];
          setError(data.message || firstError || 'Registration failed. Please check the form.');
          toast.error(data.message || firstError || 'Registration failed.');
        } else {
          // Fallback for string errors
          let errorMsg = data.message || 'Registration failed. Please try again.';
          if (Array.isArray(data.errors) && data.errors.length > 0) {
            errorMsg = data.errors.join(' • ');
          }
          setError(errorMsg);
          toast.error(errorMsg);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      const successMsg = 'Account created successfully! You can now sign in.';
      setSuccessMessage(successMsg);
      toast.success(successMsg);
      
      // Auto-redirect to sign-in after 2 seconds
      setTimeout(() => {
        navigate('/sign-in');
      }, 2000);

      setError(null);
      setServerErrors({});

      setFormData({
        firstName: '', lastName: '', email: '',
        phoneNumber: '', nationalId: '', role: 'BUYER', password: ''
      });
    } catch (error) {
      setLoading(false);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Signup error:', error);
    }
  }

  function changeHandler(event) {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }

  async function handleResendVerificationEmail() {
    if (!successEmail) return;
    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: successEmail }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Verification email sent! Check your inbox.');
      } else {
        toast.error(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Create Account</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-6 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="text-green-500" size={48} />
            <h2 className="text-2xl font-bold text-green-800">{successMessage}</h2>
            <p className="text-green-600">
              Your account has been created and is ready to use. 
              We are redirecting you to the sign-in page...
            </p>
            <Link 
              to="/sign-in" 
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Go to Sign In Now
            </Link>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ❌ {error}
        </div>
      )}

      {!successMessage && (
      <form onSubmit={submitHandler} className="flex flex-col gap-4">
        {/* Names */}
        <div className="flex gap-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="First Name *"
              className={`border p-3 rounded-lg w-full ${serverErrors.firstName ? 'border-red-500 bg-red-50' : formData.firstName ? 'border-green-500' : 'border-gray-300'}`}
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={changeHandler}
              required
            />
            {serverErrors.firstName && <p className="text-red-600 text-sm mt-1">{serverErrors.firstName}</p>}
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="Last Name *"
              className={`border p-3 rounded-lg w-full ${serverErrors.lastName ? 'border-red-500 bg-red-50' : formData.lastName ? 'border-green-500' : 'border-gray-300'}`}
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={changeHandler}
              required
            />
            {serverErrors.lastName && <p className="text-red-600 text-sm mt-1">{serverErrors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email Address *"
            className={`border p-3 rounded-lg w-full ${serverErrors.email ? 'border-red-500 bg-red-50' : formData.email ? 'border-green-500' : 'border-gray-300'}`}
            name="email"
            id="email"
            value={formData.email}
            onChange={changeHandler}
            required
          />
          {serverErrors.email && <p className="text-red-600 text-sm mt-1">{serverErrors.email}</p>}
        </div>

        {/* Phone and National ID */}
        <div className="flex gap-4">
          <div className="w-full">
            <input
              type="tel"
              placeholder="Phone (+263xxxxxxxxx or 0xxxxxxxxx) *"
              className={`border p-3 rounded-lg w-full ${serverErrors.phoneNumber ? 'border-red-500 bg-red-50' : formData.phoneNumber ? 'border-green-500' : 'border-gray-300'}`}
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={changeHandler}
              required
            />
            {serverErrors.phoneNumber && <p className="text-red-600 text-sm mt-1">{serverErrors.phoneNumber}</p>}
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="National ID (XX-XXXXXXXAXX e.g. 63-2456789Z45) *"
              className={`border p-3 rounded-lg w-full ${serverErrors.nationalId ? 'border-red-500 bg-red-50' : formData.nationalId ? 'border-green-500' : 'border-gray-300'}`}
              name="nationalId"
              id="nationalId"
              value={formData.nationalId}
              onChange={changeHandler}
              required
            />
            {serverErrors.nationalId && <p className="text-red-600 text-sm mt-1">{serverErrors.nationalId}</p>}
          </div>
        </div>

        {/* Role Selection — Public users can only be BUYER or SELLER */}
        <select
          className="border border-gray-300 p-3 rounded-lg"
          name="role"
          id="role"
          value={formData.role}
          onChange={changeHandler}
        >
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
        <p className="text-xs text-gray-500">Admin and officer accounts are created by system administrators only.</p>

        {/* Password Field with Validation */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              className={`border p-3 rounded-lg w-full pr-10 ${
                serverErrors.password ? 'border-red-500 bg-red-50' :
                formData.password
                  ? isPasswordValid
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
              name="password"
              id="password"
              value={formData.password}
              onChange={changeHandler}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {serverErrors.password && <p className="text-red-600 text-sm mt-1">{serverErrors.password}</p>}

          {/* Password Requirements — always visible when focused/has value */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-sm mb-2 text-gray-700">Password must contain:</p>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-sm ${formData.password ? (passwordValidation.length ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                {formData.password ? (passwordValidation.length ? <CheckCircle size={16} /> : <AlertCircle size={16} />) : <AlertCircle size={16} />}
                At least 8 characters
              </div>
              <div className={`flex items-center gap-2 text-sm ${formData.password ? (passwordValidation.uppercase ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                {formData.password ? (passwordValidation.uppercase ? <CheckCircle size={16} /> : <AlertCircle size={16} />) : <AlertCircle size={16} />}
                At least one uppercase letter (A–Z)
              </div>
              <div className={`flex items-center gap-2 text-sm ${formData.password ? (passwordValidation.number ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                {formData.password ? (passwordValidation.number ? <CheckCircle size={16} /> : <AlertCircle size={16} />) : <AlertCircle size={16} />}
                At least one number (0–9)
              </div>
            </div>
            {isPasswordValid && (
              <p className="text-green-600 font-semibold text-sm mt-2">✓ Password meets all requirements!</p>
            )}
          </div>
        </div>

        {/* Submit Button - Disabled until form is valid */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`p-3 rounded-lg uppercase font-semibold transition-all ${
            isFormValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <OAuth />
      </form>
      )}

      {!successMessage && (
      <div className="flex gap-2 mt-4">
        <p>Already have an account?</p>
        <Link to="/sign-in">
          <span className="text-blue-700 font-semibold hover:underline">Login Here</span>
        </Link>
      </div>
      )}

      {/* Required fields note */}
      <p className="text-xs text-gray-500 mt-4 text-center">* All fields are required. Password must meet all requirements above.</p>
    </div>
  );
}

export default SignUp;
