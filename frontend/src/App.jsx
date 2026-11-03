import React, { useState, useEffect } from "react";
import Auth from "./Auth";
import { supabase } from "./supabaseClient";
import "./styles.css";
import ChatWidget from "./ChatWidget";
import { Turnstile } from "@marsidev/react-turnstile";

const API_URL = import.meta.env.VITE_API_URL;

function App() {

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null);
    setCheckingAuth(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setCheckingAuth(false);
  });

  return () => subscription.unsubscribe();
}, []);

  const [turnstileToken, setTurnstileToken] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("contract");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isImage = (selectedFile) =>
    selectedFile && selectedFile.type.startsWith("image/");

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFile(null);
    setResult(null);
    setError("");
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setResult(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions =
      mode === "contract"
        ? [".pdf", ".png", ".jpg", ".jpeg"]
        : [".png", ".jpg", ".jpeg", ".webp"];

    const fileName = selectedFile.name.toLowerCase();
    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setFile(null);
      setError(
        mode === "contract"
          ? "Choose a PDF, PNG, JPG, or JPEG contract."
          : "Choose a PNG, JPG, JPEG, or WebP image."
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setFile(null);
      setError("File size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const analyzeFile = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security verification first.");
      return;
    }

    if (!API_URL) {
      setError("Backend URL is missing. Configure VITE_API_URL.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("turnstile_token", turnstileToken);

      const endpoint =
        mode === "image" ? "/api/detect-image" : "/api/analyze";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("Status:", response.status);
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(
          data.detail || `HTTP Error: ${response.status}`
        );
      }

      setResult(data);
    } catch (err) {
      console.error("TruDoc Error:", err);
      setError(
        err.message || "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const contractContext =
    result && mode === "contract"
      ? {
          filename: result.filename || file?.name || "Uploaded contract",
          analyzed_at: result.analyzed_at || "",
          risk_score: result.risk_score ?? result.score ?? "N/A",
          risk_level: result.risk_level ?? result.level ?? "Unknown",
          summary: result.summary || "No summary available.",
          findings: Array.isArray(result.findings)
            ? result.findings.slice(0, 10).map((finding) => {
                if (typeof finding === "string") {
                  return { title: finding };
                }

                return {
                  title:
                    finding.title ||
                    finding.clause ||
                    finding.keyword ||
                    "Potential risk",
                  description: finding.description || "",
                  explanation: finding.explanation || "",
                  matched_text: finding.matched_text || "",
                  suggestion: finding.suggestion || "",
                  level: finding.level || "",
                };
              })
            : [],
          notice: result.notice || "",
        }
      : null;

  const contractKey = contractContext
    ? String(
        result.analyzed_at ||
          `${result.filename || file?.name || ""}-${
            result.risk_score ?? result.score ?? ""
          }`
      )
    : "no-contract";

  const riskScore = result
    ? result.risk_score ?? result.score ?? "N/A"
    : "N/A";

  const riskLevel = result
    ? result.risk_level ?? result.level ?? "Unknown"
    : "Unknown";

 if (checkingAuth) {
  return <div>Loading...</div>;
}

if (!user) {
  return <Auth onLogin={setUser} />;
}

return (
    <div className="app">
      <header className="header">
        <h1>TruDoc AI</h1>
        <p>Contract Risk and AI Image Detector</p>
    

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
        >
          Logout
        </button>
      </header>

      <main className="container">
        <section className="upload-card">
          <h2>Choose Analysis Type</h2>

          <div className="mode-buttons">
            <button
              type="button"
              onClick={() => handleModeChange("contract")}
              disabled={loading}
            >
              Contract Analysis
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("image")}
              disabled={loading}
            >
              AI Image Detection
            </button>
          </div>

          <h2>
            {mode === "contract"
              ? "Analyze Your Document"
              : "Detect AI-Generated Images"}
          </h2>

          <p className="description">
            {mode === "contract"
              ? "Upload a contract to screen for potentially risky clauses. Supported formats: PDF, PNG, JPG, and JPEG."
              : "Upload an image for an experimental AI-generated image prediction. Supported formats: PNG, JPG, JPEG, and WebP."}
          </p>

          <div className="upload-area">
            <input
              type="file"
              accept={
                mode === "contract"
                  ? ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  : ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              }
              onChange={handleFileChange}
            />

            {file && (
              <p className="selected-file">
                Selected file: {file.name}
              </p>
            )}
          </div>

          <div className="turnstile-container">
            <p>Complete the security verification:</p>

            <Turnstile
              key={mode}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setError("");
              }}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />
          </div>

          <button
            type="button"
            onClick={analyzeFile}
            disabled={!file || loading || !turnstileToken}
          >
            {loading
              ? "Analyzing..."
              : mode === "contract"
                ? "Analyze Document"
                : "Detect Image"}
          </button>

          {error && (
            <div className="error" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {result && mode === "contract" && (
          <section className="result-card">
            <h2>Contract Analysis Results</h2>

            <p>
              <strong>File:</strong>{" "}
              {result.filename || file?.name || "Uploaded contract"}
            </p>

            <div className="score-section">
              <p>
                <strong>Risk Score</strong>
              </p>

              <div className="score">
                {riskScore}
                <span> / 100</span>
              </div>

              <p>
                <strong>Risk Level: </strong>
                <span
                  className={`risk-level ${String(
                    riskLevel
                  ).toLowerCase()}`}
                >
                  {riskLevel}
                </span>
              </p>
            </div>

            <div className="trudoc-ai-warning">
              <strong>⚠️ Automated assessment</strong>
              <p>
                This is an automated screening estimate, not proof
                that a contract is safe, unsafe, genuine, or fraudulent.
                Verify important findings with a qualified legal
                professional.
              </p>
            </div>

            <h3>Summary</h3>
            <p>{result.summary || "No summary provided."}</p>

            <h3>Potentially Risky Clauses</h3>

            {Array.isArray(result.findings) &&
            result.findings.length > 0 ? (
              <ul className="findings">
                {result.findings.map((finding, index) => (
                  <li key={index}>
                    {typeof finding === "string" ? (
                      finding
                    ) : (
                      <>
                        <strong>
                          {finding.title ||
                            finding.clause ||
                            finding.keyword ||
                            "Potential risk"}
                        </strong>

                        {finding.description && <p>{finding.description}</p>}
                        {finding.explanation && <p>{finding.explanation}</p>}

                        {finding.matched_text && (
                          <p>
                            <strong>Matched text: </strong>
                            {finding.matched_text}
                          </p>
                        )}

                        {finding.suggestion && (
                          <p>
                            <strong>Suggestion: </strong>
                            {finding.suggestion}
                          </p>
                        )}

                        {(finding.level || finding.severity) && (
                          <p>
                            <strong>Severity: </strong>
                            {finding.level || finding.severity}
                          </p>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No potential issues were identified by the analysis.</p>
            )}

            {result.preview && (
              <>
                <h3>Extracted Text Preview</h3>
                <pre className="preview">{result.preview}</pre>
              </>
            )}

            {result.notice && <p className="notice">{result.notice}</p>}
          </section>
        )}

        {result && mode === "image" && (
          <section className="result-card">
            <h2>AI Image Detection Results</h2>

            <p>
              <strong>File:</strong>{" "}
              {result.filename || file?.name || "Uploaded image"}
            </p>

            <p>
              <strong>Prediction: </strong>
              {result.prediction || "Uncertain"}
            </p>

            <p>
              <strong>Model label: </strong>
              {result.model_label || "Unavailable"}
            </p>

            <p>
              <strong>Confidence score: </strong>
              {typeof result.score === "number"
                ? `${(result.score * 100).toFixed(1)}%`
                : "Unavailable"}
            </p>

            {Array.isArray(result.all_predictions) && (
              <>
                <h3>All model predictions</h3>
                <ul>
                  {result.all_predictions.map((item, index) => (
                    <li key={`${item.label}-${index}`}>
                      {item.label}: {(item.score * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="trudoc-ai-warning">
              <strong>Important limitation</strong>
              <p>
                This experimental model provides an estimate, not proof
                of an image's origin. It can make mistakes, and its
                confidence score is not a guarantee of accuracy.
              </p>
            </div>

            {result.notice && <p className="notice">{result.notice}</p>}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>TruDoc AI | Contract screening and image analysis</p>
        <p>This tool does not replace professional legal advice.</p>
      </footer>

      <ChatWidget
        contractContext={contractContext}
        contractKey={contractKey}
      />
    </div>
  );
}

export default App;
