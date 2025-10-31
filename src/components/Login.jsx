import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyCredentials } from "../config/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Verify credentials
    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      // Invalid credentials
      setIsLoading(false);
      setError("Invalid username or password");
      return;
    }

    // Valid credentials - proceed with login
    // Start fade-out animation after a brief moment
    setTimeout(() => {
      setIsFadingOut(true);
    }, 600);

    // Store auth flag, username and navigate after fade-out completes
    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      navigate("/dashboard");
    }, 1400);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-deep-navy via-card-bg to-deep-navy flex items-center justify-center p-4 login-page ${
        isFadingOut ? "fade-out-page" : ""
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-block bg-gradient-to-r from-medium-purple to-light-purple p-4 rounded-2xl mb-4">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Paperlytics</h1>
          <p className="text-light-purple">Paper Process Monitoring System</p>
        </div>

        {/* Login Card */}
        <div
          className="bg-card-bg/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-medium-purple/30 fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-warning-red/20 border border-warning-red rounded-lg p-3 animate-slideDown">
                <p className="text-warning-red text-sm font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-light-purple text-sm font-medium mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className={`w-full px-4 py-3 bg-deep-navy/50 border rounded-lg text-white placeholder-light-purple/50 focus:outline-none focus:ring-2 focus:ring-medium-purple focus:border-transparent transition-all duration-300 ${
                  error ? "border-warning-red" : "border-medium-purple/50"
                }`}
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-light-purple text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className={`w-full px-4 py-3 bg-deep-navy/50 border rounded-lg text-white placeholder-light-purple/50 focus:outline-none focus:ring-2 focus:ring-medium-purple focus:border-transparent transition-all duration-300 ${
                  error ? "border-warning-red" : "border-medium-purple/50"
                }`}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-medium-purple to-light-purple text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-center text-light-purple/60 text-sm mt-6 fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Secure Industrial Monitoring Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
