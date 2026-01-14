import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyCredentials } from "../config/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      className={`min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-black dark:via-gray-900 dark:to-black flex items-center justify-center p-4 login-page ${
        isFadingOut ? "fade-out-page" : ""
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-block bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-700 dark:to-gray-800 p-4 rounded-2xl mb-4">
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Paperlytics</h1>
          <p className="text-gray-700 dark:text-gray-400">Paper Process Monitoring System</p>
        </div>

        {/* Login Card */}
        <div
          className="bg-white/90 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-300 dark:border-gray-700/30 fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
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
                className="block text-gray-700 dark:text-light-purple text-sm font-medium mb-2"
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
                className={`w-full px-4 py-3 bg-gray-100 dark:bg-black/50 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-light-purple/50 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-medium-purple focus:border-transparent transition-all duration-300 ${
                  error ? "border-warning-red" : "border-gray-300 dark:border-gray-700/50"
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
                className="block text-gray-700 dark:text-light-purple text-sm font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={`w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-black/50 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-light-purple/50 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-medium-purple focus:border-transparent transition-all duration-300 ${
                    error ? "border-warning-red" : "border-gray-300 dark:border-gray-700/50"
                  }`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-light-purple hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
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
