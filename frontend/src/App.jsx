import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const STEPS = [
  {
    number: "01",
    title: "SEE",
    text: "Photograph something ordinary around you.",
  },
  {
    number: "02",
    title: "GUESS",
    text: "CuriousLenz figures out what you're looking at.",
  },
  {
    number: "03",
    title: "LEARN",
    text: "Discover one surprising thing about it.",
  },
  {
    number: "04",
    title: "PLAY",
    text: "Test yourself with two truths and one lie.",
  },
  {
    number: "05",
    title: "OUTDOOR QUEST",
    text: "Step outside and explore the world around you.",
  },
];

const LOADING_MESSAGES = [
  "Looking closely...",
  "Figuring out what you found...",
  "Searching for something curious...",
  "Preparing your discovery...",
];

function App() {
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    LOADING_MESSAGES[0]
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);

    objectUrlRef.current = url;

    setImage(file);
    setPreview(url);
    setError("");
    setResult(null);
    setSelectedAnswer(null);
    setQuizChecked(false);
  }, []);

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;

      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();

          if (file) {
            handleFile(file);
          }

          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [handleFile]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  // ================= AI IMAGE ANALYSIS =================

  const analyzeImage = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedAnswer(null);
    setQuizChecked(false);

    let messageIndex = 0;

    const messageTimer = setInterval(() => {
      messageIndex =
        (messageIndex + 1) % LOADING_MESSAGES.length;

      setLoadingMessage(
        LOADING_MESSAGES[messageIndex]
      );
    }, 1400);

    try {
      const formData = new FormData();

      formData.append("image", image);

      const response = await fetch(
        "https://curiouslenz.onrender.com/api/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong."
        );
      }

      console.log("BACKEND RESPONSE:", data);

      setResult({
        object: data.object || "Unknown object",
        fact: data.fact || "No fact available.",
        quiz: Array.isArray(data.quiz) ? data.quiz : [],
        answer: Number(data.answer) || 1,
        explanation:
          data.explanation ||
          "No explanation available.",
        lookAgain:
          data.lookAgain ||
          "Look carefully at the image again.",
        filename: data.filename || image.name,
      });

      setTimeout(() => {
        document
          .getElementById("discovery")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    } catch (err) {
      console.error("Analysis error:", err);

      setError(
        err.message ||
          "Unable to analyze the image. Please check that the backend is running."
      );
    } finally {
      clearInterval(messageTimer);

      setLoading(false);

      setLoadingMessage(
        LOADING_MESSAGES[0]
      );
    }
  };

  // ================= QUIZ =================

  const checkAnswer = () => {
    if (selectedAnswer === null) return;

    setQuizChecked(true);
  };

  // ================= NEW DISCOVERY =================

  const startNewDiscovery = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }

    setImage(null);
    setPreview("");
    setResult(null);
    setError("");
    setSelectedAnswer(null);
    setQuizChecked(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="app-shell">

      {/* ================= NAVBAR ================= */}

      <header className="navbar">

        <button
          className="brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          CURIOUS<span>LENZ</span>
        </button>

        <button
          className="nav-how"
          onClick={() =>
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
        >
          How it works
          <span>↘</span>
        </button>

      </header>

      <main>

        {/* ================= HERO ================= */}

        <section className="hero">

          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            A SMALL EXPERIMENT IN CURIOSITY
          </div>

          <h1>
            Turn ordinary things
            <br />
            into <em>curious discoveries.</em>
          </h1>

          <p className="hero-copy">
            Snap something around you. CuriousLenz helps you
            identify it, discover something surprising, and
            then step outside to explore the world around you.
          </p>

          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={openFilePicker}
            >
              Start exploring
              <span>→</span>
            </button>

            <span className="hero-hint">
              No account required
            </span>

          </div>

        </section>

        {/* ================= UPLOAD ================= */}

        <section
          className="explore-section"
          id="explore"
        >

          <div className="section-label">
            <span>01</span>
            YOUR SPECIMEN
          </div>

          {!image ? (

            <div
              className={`upload-card ${
                dragActive ? "drag-active" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >

              <div className="upload-topline">
                <span>FRAME 01</span>
                <span>READY TO OBSERVE</span>
              </div>

              <div className="upload-center">

                <div className="camera-mark">
                  <div className="camera-body">
                    <div className="camera-lens"></div>
                  </div>
                </div>

                <h2>
                  What caught your eye?
                </h2>

                <p>
                  Drop a photo here, or choose an image
                  from your device.
                </p>

                <button
                  className="choose-button"
                  onClick={openFilePicker}
                >
                  Choose an image
                </button>

                <div className="format-hint">
                  PNG · JPG · WEBP · CTRL + V
                </div>

              </div>

            </div>

          ) : (

            <div className="preview-card">

              <div className="preview-topline">
                <span>FRAME 01</span>
                <span>SPECIMEN CAPTURED</span>
              </div>

              {/* Image preview removed from this stage */}

              <div className="preview-info preview-info-full">

                <span className="small-label">
                  YOUR PHOTO
                </span>

                <h2>
                  Ready to discover?
                </h2>

                <p>
                  We've got your image. Let CuriousLenz
                  take a closer look.
                </p>

                <div className="file-name">
                  {image.name}
                </div>

                <div className="preview-actions">

                  <button
                    className="primary-button"
                    onClick={analyzeImage}
                    disabled={loading}
                  >
                    {loading
                      ? "Looking..."
                      : "Analyze this"}

                    {!loading && (
                      <span>→</span>
                    )}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={openFilePicker}
                    disabled={loading}
                  >
                    Choose another
                  </button>

                </div>

              </div>

              {loading && (

                <div className="loading-bar-area">

                  <div className="loading-spinner"></div>

                  <span>
                    {loadingMessage}
                  </span>

                </div>

              )}

            </div>

          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleInputChange}
            hidden
          />

          {error && (

            <div className="error-box">

              <strong>
                Something went wrong
              </strong>

              <span>
                {error}
              </span>

            </div>

          )}

        </section>

        {/* ================= DISCOVERY ================= */}

        {result && (

          <section
            className="discovery-section"
            id="discovery"
          >

            <div className="discovery-header">

              <div>

                <div className="section-label">
                  <span>02</span>
                  NEW DISCOVERY
                </div>

                <h2>
                  Your object has a story.
                </h2>

              </div>

              <button
                className="new-discovery"
                onClick={startNewDiscovery}
              >
                ← New discovery
              </button>

            </div>

            {/* ================= OBJECT ================= */}

            <div className="object-card">

              <div className="object-photo">

                <img
                  src={preview}
                  alt="Your discovered object"
                />

              </div>

              <div className="object-name-area">

                <span className="small-label">
                  WE THINK THIS IS
                </span>

                <h3>
                  {result.object}
                </h3>

                <span className="confidence">
                  AI IDENTIFICATION
                </span>

              </div>

            </div>

            {/* ================= FACT ================= */}

            <div className="fact-card">

              <div className="fact-number">
                01
              </div>

              <div>

                <span className="small-label">
                  DID YOU KNOW?
                </span>

                <h3>
                  There's more to this than meets the eye.
                </h3>

                <p>
                  {result.fact}
                </p>

              </div>

            </div>

            {/* ================= QUIZ ================= */}

            <div className="quiz-card">

              <div className="quiz-heading">

                <span className="small-label">
                  02 · PLAY
                </span>

                <h3>
                  Two truths + one lie.
                </h3>

                <p>
                  One of these statements isn't true.
                  Can you spot it?
                </p>

              </div>

              <div className="quiz-options">

                {result.quiz.map(
                  (option, index) => {

                    const optionNumber =
                      index + 1;

                    let className =
                      "quiz-option";

                    if (
                      selectedAnswer ===
                      optionNumber
                    ) {
                      className += " selected";
                    }

                    if (
                      quizChecked &&
                      optionNumber ===
                        result.answer
                    ) {
                      className += " correct";
                    }

                    if (
                      quizChecked &&
                      selectedAnswer ===
                        optionNumber &&
                      optionNumber !==
                        result.answer
                    ) {
                      className += " incorrect";
                    }

                    return (
                      <button
                        key={option}
                        className={className}
                        onClick={() =>
                          !quizChecked &&
                          setSelectedAnswer(
                            optionNumber
                          )
                        }
                      >

                        <span className="option-number">
                          {optionNumber}
                        </span>

                        <span>
                          {option}
                        </span>

                        <span className="option-arrow">
                          →
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

              {!quizChecked ? (

                <button
                  className="check-button"
                  onClick={checkAnswer}
                  disabled={
                    selectedAnswer === null
                  }
                >
                  Check my answer
                  <span>→</span>
                </button>

              ) : (

                <div
                  className={`answer-result ${
                    selectedAnswer ===
                    result.answer
                      ? "answer-correct"
                      : "answer-wrong"
                  }`}
                >

                  <div className="answer-title">

                    {selectedAnswer ===
                    result.answer
                      ? "Nice catch. ✓"
                      : "Not quite. Here's the answer."}

                  </div>

                  <p>
                    {result.explanation}
                  </p>

                </div>

              )}

            </div>

            {/* ================= LOOK AGAIN ================= */}

            <div className="look-again-card">

              <div className="look-icon">
                ⌕
              </div>

              <div className="look-content">

                <span className="small-label">
                  03 · OUTDOOR QUEST
                </span>

                <h3>
                  Ready to Step outside?
                </h3>

                <p>
                  {result.lookAgain}
                </p>

              </div>

            </div>

          </section>

        )}

        {/* ================= HOW IT WORKS ================= */}

        <section
          className="how-section"
          id="how-it-works"
        >

          <div className="section-label">
            <span>HOW</span>
            THE CURIOUSLENZ METHOD
          </div>

          <div className="how-heading">

            <h2>
              Look closer.
              <br />
              <em>Learn differently.</em>
            </h2>

            <p>
              Curiosity starts with noticing something
              ordinary. We turn that tiny moment into an
              interactive learning experience.
            </p>

          </div>

          <div className="steps-grid">

            {STEPS.map((step) => (

              <div
                className="step-card"
                key={step.number}
              >

                <span className="step-number">
                  {step.number}
                </span>

                <h3>
                  {step.title}
                </h3>

                <p>
                  {step.text}
                </p>

              </div>

            ))}

          </div>

        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="footer-main">

          <div>

            <div className="footer-brand">
              CURIOUS<span>LENZ</span>
            </div>

            <p>
              Learn more about  the things you already see.
            </p>

          </div>

          <div className="footer-note">
            BUILT FOR CURIOUS MINDS
            <br />
            2026
          </div>

        </div>

        <div className="footer-bottom">

          <span>
            SEE · GUESS · LEARN · PLAY · STEP OUTSIDE
          </span>

          <span>
            AN EXPERIMENT IN EVERYDAY CURIOSITY
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;
