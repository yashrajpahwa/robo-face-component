import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";

const RobotFace = forwardRef(
  (
    {
      size = "100vh",
      expression = "neutral",
      colorPalette = {},
      autoBlink = true,
      onExpressionChange,
      mouthValue = 0,
      pupilX = null,
      pupilY = null,
    },
    ref
  ) => {
    const EXPRESSIONS = ["neutral", "happy", "surprised", "angry", "sad"];
    const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const faceRef = useRef(null);
    const mouthRef = useRef(null);
    const blinkTimeoutRef = useRef(null);

    const mergedColors = {
      face: "#E0E0E0",
      eye: "#FFFFFF",
      mouth: "#333333",
      accent: "#BDBDBD",
      pupil: "#333333",
      ...colorPalette,
    };

    useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = () => setPrefersReducedMotion(mediaQuery.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    const setExpression = useCallback(
      (newExpression) => {
        if (EXPRESSIONS.includes(newExpression) && onExpressionChange) {
          onExpressionChange(newExpression);
        }
      },
      [onExpressionChange]
    );

    useImperativeHandle(ref, () => ({
      getExpression: () => expression,
    }));

    // Auto-blinking effect
    useEffect(() => {
      const scheduleBlink = () => {
        if (!autoBlink || prefersReducedMotion) return;
        clearTimeout(blinkTimeoutRef.current);
        const nextBlink = Math.random() * 5000 + 1000;
        blinkTimeoutRef.current = setTimeout(() => {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 150);
          scheduleBlink();
        }, nextBlink);
      };

      scheduleBlink();
      return () => clearTimeout(blinkTimeoutRef.current);
    }, [autoBlink, prefersReducedMotion]);

    // Pupil control from props
    useEffect(() => {
      if (prefersReducedMotion) {
        setPupilPos({ x: 0, y: 0 });
        return;
      }

      const maxPupilDist = 4;
      const newX =
        pupilX !== null
          ? Math.max(
              -maxPupilDist,
              Math.min(maxPupilDist, pupilX * maxPupilDist)
            )
          : 0;
      const newY =
        pupilY !== null
          ? Math.max(
              -maxPupilDist,
              Math.min(maxPupilDist, pupilY * maxPupilDist)
            )
          : 0;

      if (pupilX !== null || pupilY !== null) {
        setPupilPos({ x: newX, y: newY });
      }
    }, [pupilX, pupilY, prefersReducedMotion]);

    // Pupil tracking effect
    useEffect(() => {
      if (prefersReducedMotion || pupilX !== null || pupilY !== null) {
        if (pupilX === null && pupilY === null) {
          setPupilPos({ x: 0, y: 0 });
        }
        return;
      }

      const handleMouseMove = (event) => {
        if (!faceRef.current) return;
        const bounds = faceRef.current.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const clientX = event.touches
          ? event.touches[0].clientX
          : event.clientX;
        const clientY = event.touches
          ? event.touches[0].clientY
          : event.clientY;

        const deltaX = (clientX - centerX) / bounds.width;
        const deltaY = (clientY - centerY) / bounds.height;

        // Clamp pupil movement within a radius
        const maxPupilDist = 4;
        const pupilX = Math.max(
          -maxPupilDist,
          Math.min(maxPupilDist, deltaX * 20)
        );
        const pupilY = Math.max(
          -maxPupilDist,
          Math.min(maxPupilDist, deltaY * 20)
        );

        setPupilPos({ x: pupilX, y: pupilY });
      };

      const handleMouseLeave = () => {
        setPupilPos({ x: 0, y: 0 });
      };

      const faceEl = faceRef.current;
      if (faceEl) {
        faceEl.addEventListener("mousemove", handleMouseMove);
        faceEl.addEventListener("touchmove", handleMouseMove);
        faceEl.addEventListener("mouseleave", handleMouseLeave);
        faceEl.addEventListener("touchend", handleMouseLeave);
      }

      return () => {
        if (faceEl) {
          faceEl.removeEventListener("mousemove", handleMouseMove);
          faceEl.removeEventListener("touchmove", handleMouseMove);
          faceEl.removeEventListener("mouseleave", handleMouseLeave);
          faceEl.removeEventListener("touchend", handleMouseLeave);
        }
      };
    }, [prefersReducedMotion, pupilX, pupilY]);

    const cycleExpression = (direction = 1) => {
      const currentIndex = EXPRESSIONS.indexOf(expression);
      const nextIndex =
        (currentIndex + direction + EXPRESSIONS.length) % EXPRESSIONS.length;
      setExpression(EXPRESSIONS[nextIndex]);
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        cycleExpression(1);
      } else if (e.key === "ArrowLeft") {
        cycleExpression(-1);
      }
    };

    const expressionStyles = {
      neutral: {
        eyebrowLeft: { transform: "translate(22px, 25px) rotate(0deg)" },
        eyebrowRight: { transform: "translate(62px, 25px) rotate(0deg)" },
        mouthPath: "M 40 75 Q 50 75 60 75",
      },
      happy: {
        eyebrowLeft: { transform: "translate(22px, 23px) rotate(-5deg)" },
        eyebrowRight: { transform: "translate(62px, 23px) rotate(5deg)" },
        mouthPath: "M 35 72 Q 50 85 65 72",
      },
      sad: {
        eyebrowLeft: { transform: "translate(22px, 28px) rotate(15deg)" },
        eyebrowRight: { transform: "translate(62px, 28px) rotate(-15deg)" },
        mouthPath: "M 35 78 Q 50 65 65 78",
      },
      angry: {
        eyebrowLeft: { transform: "translate(22px, 26px) rotate(-20deg)" },
        eyebrowRight: { transform: "translate(62px, 26px) rotate(20deg)" },
        mouthPath: "M 40 75 Q 50 70 60 75",
      },
      surprised: {
        eyebrowLeft: { transform: "translate(22px, 20px) rotate(-8deg)" },
        eyebrowRight: { transform: "translate(62px, 20px) rotate(8deg)" },
        mouthPath: "M 45 72 C 47 80, 53 80, 55 72 Z",
      },
    };

    const currentStyle = expressionStyles[expression];
    const eyelidPath = isBlinking
      ? "M 0 0 C 5 15, 15 15, 20 0 Z"
      : "M 0 0 C 5 2, 15 2, 20 0 Z";

    const transitionDuration = prefersReducedMotion ? "0s" : "0.3s";
    const mouthTransitionDuration = prefersReducedMotion ? "0s" : "0.1s";

    // Calculate mouth scale based on mouthValue
    const mouthScale = Math.max(0, Math.min(1, mouthValue / 100));
    const isTalking = mouthValue > 0;

    const styles = `
    .robot-face-container:focus {
      outline: 2px solid ${mergedColors.accent};
      outline-offset: 4px;
    }
    .robot-face-part {
      transition: all ${transitionDuration} cubic-bezier(0.4, 0, 0.2, 1);
    }
    .robot-mouth {
      transition: transform ${mouthTransitionDuration} ease-out, d ${transitionDuration} ease-out;
    }
  `;

    return (
      <>
        <style>{styles}</style>
        <div
          ref={faceRef}
          className="robot-face-container"
          style={{
            width: "100vw",
            height: size,
            cursor: "pointer",
            touchAction: "none",
            padding: "auto",
            margin: "auto",
            overflow: "hidden",
          }}
          onClick={() => cycleExpression(1)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="img"
          aria-label={`A robot face with a ${expression} expression.`}
        >
          <svg
            viewBox="0 0 100 100"
            width={"100vw"}
            height={size}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {/* Head */}
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              rx="15"
              fill={mergedColors.face}
              stroke={mergedColors.accent}
              strokeWidth="2"
            />
            {/* Panel Lines */}
            {/* <line
              x1="10"
              y1="50"
              x2="90"
              y2="50"
              stroke={mergedColors.accent}
              strokeWidth="1"
            />
            <line
              x1="50"
              y1="10"
              x2="50"
              y2="90"
              stroke={mergedColors.accent}
              strokeWidth="1"
            /> */}

            {/* Antenna */}
            <line
              x1="75"
              y1="10"
              x2="80"
              y2="5"
              stroke={mergedColors.accent}
              strokeWidth="1.5"
            />
            <circle cx="81" cy="4" r="2" fill={mergedColors.accent} />

            {/* Eyes */}
            <g>
              {/* Left Eye */}
              <circle cx="35" cy="40" r="10" fill={mergedColors.eye} />
              <circle
                className="robot-face-part"
                cx="35"
                cy="40"
                r="5"
                fill={mergedColors.pupil}
                style={{
                  transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)`,
                }}
              />
              {/* Right Eye */}
              <circle cx="65" cy="40" r="10" fill={mergedColors.eye} />
              <circle
                className="robot-face-part"
                cx="65"
                cy="40"
                r="5"
                fill={mergedColors.pupil}
                style={{
                  transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)`,
                }}
              />
            </g>

            {/* Eyelids */}
            <g fill={mergedColors.face}>
              {/* Left Eyelid */}
              <path
                className="robot-face-part"
                d={eyelidPath}
                style={{
                  transform: `translate(25px, ${
                    isBlinking ? 29 : -5
                  }px) scale(1, ${isBlinking ? 1 : 0.1})`,
                }}
              />
              {/* Right Eyelid */}
              <path
                className="robot-face-part"
                d={eyelidPath}
                style={{
                  transform: `translate(55px, ${
                    isBlinking ? 29 : -5
                  }px) scale(1, ${isBlinking ? 1 : 0.1})`,
                }}
              />
            </g>

            {/* Eyebrows */}
            <g
              stroke={mergedColors.mouth}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path
                d="M 0 0 L 16 0"
                className="robot-face-part"
                style={currentStyle.eyebrowLeft}
              />
              <path
                d="M 0 0 L 16 0"
                className="robot-face-part"
                style={currentStyle.eyebrowRight}
              />
            </g>

            {/* Mouth */}
            <path
              ref={mouthRef}
              d={
                isTalking
                  ? "M 40 75 Q 50 75 60 75" // Base shape for talking
                  : currentStyle.mouthPath
              }
              fill="none"
              stroke={mergedColors.mouth}
              strokeWidth="2"
              strokeLinecap="round"
              className="robot-mouth robot-face-part"
              style={{
                transformOrigin: "50px 75px",
                transform: isTalking
                  ? `scaleY(${1 + mouthScale * 8})`
                  : "scaleY(1)",
              }}
            />
          </svg>
        </div>
      </>
    );
  }
);

RobotFace.displayName = "RobotFace";

RobotFace.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  expression: PropTypes.oneOf([
    "neutral",
    "happy",
    "sad",
    "angry",
    "surprised",
  ]),
  colorPalette: PropTypes.shape({
    face: PropTypes.string,
    eye: PropTypes.string,
    mouth: PropTypes.string,
    accent: PropTypes.string,
    pupil: PropTypes.string,
  }),
  autoBlink: PropTypes.bool,
  onExpressionChange: PropTypes.func,
  mouthValue: PropTypes.number,
  pupilX: PropTypes.number,
  pupilY: PropTypes.number,
};

export default RobotFace;
