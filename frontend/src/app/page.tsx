"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";

export default function Home() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Improvement",
    submitterName: "",
    submitterEmail: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Basic Validation
    if (!formData.title.trim()) {
      setStatus("error");
      setErrorMessage("Title is required");
      return;
    }

    if (formData.description.trim().length < 20) {
      setStatus("error");
      setErrorMessage("Description must be at least 20 characters");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        setFormData({
          title: "",
          description: "",
          category: "Improvement",
          submitterName: "",
          submitterEmail: "",
        });
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Failed to submit feedback");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Network error, please try again later");
      console.error(error);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 sm:p-24 selection:bg-indigo-100 dark:bg-neutral-900">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-800 rounded-3xl shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        <div className="p-8 sm:p-12">
          <header className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
              Share Your Feedback
            </h1>
            <p className="mt-3 text-neutral-500 dark:text-neutral-400">
              Help us improve FeedPulse by sharing your thoughts or reporting issues.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                Feedback Title *
              </label>
              <input
                id="title"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-neutral-900 dark:text-neutral-100"
                placeholder="Briefly summarize your feedback"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-neutral-900 dark:text-neutral-100 appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Improvement">Improvement</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  Your Name <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-neutral-900 dark:text-neutral-100"
                  placeholder="John Doe"
                  value={formData.submitterName}
                  onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                Your Email <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-neutral-900 dark:text-neutral-100"
                placeholder="john@example.com"
                value={formData.submitterEmail}
                onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                Detailed Description *
              </label>
              <textarea
                id="description"
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-neutral-900 dark:text-neutral-100 resize-none"
                placeholder="Please provide details (minimum 20 characters)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                status === "loading"
                  ? "bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {status === "loading" ? "Submitting..." : "Send Feedback"}
            </button>

            {status === "success" && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center text-sm font-semibold animate-in fade-in duration-300">
                ✨ Thank you! Your feedback has been submitted successfully.
              </div>
            )}

            {status === "error" && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-center text-sm font-semibold animate-in fade-in duration-300">
                ⚠️ {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
      
      <footer className="mt-12 text-sm text-neutral-400 flex items-center gap-2">
        Powered by <span className="font-bold text-neutral-600 dark:text-neutral-300 tracking-tight">FeedPulse AI</span>
      </footer>
    </div>
  );
}
