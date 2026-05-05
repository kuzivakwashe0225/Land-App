import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from "../redux/user/userSlice";
import OAuth from "../components/OAuth";
import toast from 'react-hot-toast';

function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { loading, error } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  async function submitHandler(event) {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      const msg = 'Please enter your email and password.';
      dispatch(signInFailure(msg));
      toast.error(msg);
      return;
    }

    try {
      dispatch(signInStart());

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        const msg = data.message || 'Sign in failed. Please try again.';
        dispatch(signInFailure(msg));
        toast.error(msg);
        return;
      }

      // Support both data.user and legacy data.rest formats
      dispatch(signInSuccess(data.user || data.rest || data));
      setFormData({ email: '', password: '' });
      toast.success('Signed in successfully!');

      setTimeout(() => { navigate('/'); }, 1000);
    } catch (error) {
      const msg = 'Network error. Please check your connection and try again.';
      dispatch(signInFailure(msg));
      toast.error(msg);
    }
  }

  function changeHandler(event) {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Sign In</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={submitHandler} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email Address"
          className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          name="email"
          id="email"
          value={formData.email}
          onChange={changeHandler}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          name="password"
          id="password"
          value={formData.password}
          onChange={changeHandler}
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase font-semibold hover:opacity-95 disabled:opacity-70 transition-opacity"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <OAuth />
      </form>

      <div className="flex gap-2 mt-4">
        <p>Don&apos;t have an account?</p>
        <Link to="/sign-up">
          <span className="text-blue-700 font-semibold hover:underline">Sign Up</span>
        </Link>
      </div>
    </div>
  );
}

export default SignIn;
