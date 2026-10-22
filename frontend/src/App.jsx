import React, { useState } from "react";
import "./styles.css";
import ChatWidget from "./ChatWidget";
import { Turnstile } from "@marsidev/react-turnstile";
const API_URL = import.meta.env.VITE_API_URL;
function App() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setResult(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    const fileName = selectedFile.name.toLowerCase();

    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setFile(null);
      setError("Please choose a PDF, PNG, JPG, or JPEG file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setFile(null);
      setError("File size must be less than 15 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError("Please choose a PDF, PNG, JPG, or JPEG file first.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security verification first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("turnstile_token", turnstileToken);

      const response = await fetch(
       `${import.meta.env.VITE_API_URL}/api/analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Status:", response.status);
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(
          data.detail || `HTTP Error: ${response.status}`
        );
      }

      setResult(data);
    } catch (error) {
      console.error("TruDoc Error:", error);
      setError(error.message || "Failed to analyze document.");
    } finally {
      setLoading(false);
    }
  };

  // Share the current analysis with the chatbot.
  const contractContext = result
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

  // Change the key when a new analysis becomes available.
  const contractKey = result
    ? String(
        result.analyzed_at ||
          `${result.filename || file?.name || ""}-${
            result.risk_score ?? result.score ?? ""
          }`
      )
    : "no-contract";

  return (
    <div className="app">
      <header className="header">
        <h1>TruDoc AI</h1>
        <p>AI-Powered Contract Risk Detector</p>
      </header>

      <main className="container">
        <section className="upload-card">
          <h2>Analyze Your Document</h2>

          <p className="description">
            Upload a contract to identify potentially risky clauses.
            Supported formats: PDF, PNG, JPG, and JPEG.
          </p>

          <div className="upload-area">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
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
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />
          </div>

          <button
            type="button"
            onClick={analyzeDocument}
            disabled={!file || loading || !turnstileToken}
          >
            {loading ? "Analyzing..." : "Analyze Document"}
          </button>

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {result && (
          <section className="result-card">
            <h2>Analysis Results</h2>

            <p>
              <strong>File:</strong>{" "}
              {result.filename || file?.name || "Uploaded contract"}
            </p>

            <div className="score-section">
              <p>
                <strong>Risk Score</strong>
              </p>

              <div className="score">
                {result.risk_score ?? result.score ?? "N/A"}
                <span> / 100</span>
              </div>

              <p>
                <strong>Risk Level: </strong>
                <span
                  className={`risk-level ${String(
                    result.risk_level ?? result.level ?? "unknown"
                  ).toLowerCase()}`}
                >
                  {result.risk_level ?? result.level ?? "Unknown"}
                </span>
              </p>
            </div>

            <div className="trudoc-ai-warning">
              <strong>⚠️ AI-generated assessment</strong>
              <p>
                This result is an AI-generated estimate, not proof
                that a contract is genuine, fake, safe, or fraudulent.
                AI may make mistakes or miss important details.
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

                        {finding.description && (
                          <p>{finding.description}</p>
                        )}

                        {finding.explanation && (
                          <p>{finding.explanation}</p>
                        )}

                        {finding.matched_text && (
                          <p>{finding.matched_text}</p>
                        )}

                        {finding.suggestion && (
                          <p>
                            <strong>Suggestion: </strong>
                            {finding.suggestion}
                          </p>
                        )}

                        {finding.level && (
                          <p>
                            <strong>Severity: </strong>
                            {finding.level}
                          </p>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No potential issues were identified by the analysis.
              </p>
            )}

            {result.preview && (
              <>
                <h3>Extracted Text Preview</h3>
                <pre className="preview">{result.preview}</pre>
          </>
        )}

        {result.notice && (
          <p className="notice">{result.notice}</p>
        )}
      </section>
    )}
  </main>

  <footer className="footer">
    <p>TruDoc AI | Contract screening assistance</p>
    <p>
      This tool does not replace professional legal advice.
    </p>
  </footer>

  <ChatWidget
    contractContext={contractContext}
    contractKey={contractKey}
  />
</div>

);
}

export default App;