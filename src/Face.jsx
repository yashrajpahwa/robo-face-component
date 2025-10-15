import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";

// --- Custom Hooks & Helpers ---

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// --- Main Component ---

const RobotFace = forwardRef(
  (
    {
      size = 300,
      initialExpression = "neutral",
      expression: controlledExpression,
      colorPalette = {},
      autoBlink = true,
      onExpressionChange,
      mouthValue = 0,
    },
    ref
  ) => {
    const EXPRESSIONS = ["neutral", "happy", "surprised", "angry", "sad"];

    const isControlled = controlledExpression !== undefined;
    const [internalExpression, setInternalExpression] =
      useState(initialExpression);
    const expression = isControlled ? controlledExpression : internalExpression;

    const [isBlinking, setIsBlinking] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const faceRef = useRef(null);
    const blinkTimeoutRef = useRef(null);

    const mergedColors = {
      background: "#000000",
      accent: "#00D0FF",
      ...colorPalette,
    };

    useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = () => setPrefersReducedMotion(mediaQuery.matches);
      handler(); // Set initial value
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    const setExpression = useCallback(
      (newExpression) => {
        if (EXPRESSIONS.includes(newExpression)) {
          if (!isControlled) setInternalExpression(newExpression);
          if (onExpressionChange) onExpressionChange(newExpression);
        }
      },
      [isControlled, onExpressionChange]
    );

    useImperativeHandle(ref, () => ({
      setExpression,
      getExpression: () => expression,
    }));

    // Auto-blinking effect
    useEffect(() => {
      const scheduleBlink = () => {
        if (!autoBlink || prefersReducedMotion) return;
        clearTimeout(blinkTimeoutRef.current);
        const nextBlink = Math.random() * 4000 + 2000;
        blinkTimeoutRef.current = setTimeout(() => {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 200);
          scheduleBlink();
        }, nextBlink);
      };
      scheduleBlink();
      return () => clearTimeout(blinkTimeoutRef.current);
    }, [autoBlink, prefersReducedMotion]);

    const cycleExpression = (direction = 1) => {
      const currentIndex = EXPRESSIONS.indexOf(expression);
      const nextIndex =
        (currentIndex + direction + EXPRESSIONS.length) % EXPRESSIONS.length;
      setExpression(EXPRESSIONS[nextIndex]);
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") cycleExpression(1);
      if (e.key === "ArrowLeft") cycleExpression(-1);
    };

    // SVG path data definitions, separated by feature
    const expressionStyles = {
      neutral: {
        eyes: {
          eyeLeftPath:
            "M 22 30 a 5 5 0 0 1 5 -5 h 10 a 5 5 0 0 1 5 5 v 20 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
          eyeRightPath:
            "M 58 30 a 5 5 0 0 1 5 -5 h 10 a 5 5 0 0 1 5 5 v 20 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
        },
        mouth: {
          path: "M 40 78 H 60",
          stroke: mergedColors.accent,
          fill: "none",
          strokeWidth: 3,
        },
      },
      happy: {
        eyes: {
          eyeLeftPath: "M 22 50 C 28 40, 38 40, 42 50 Z",
          eyeRightPath: "M 58 50 C 64 40, 74 40, 78 50 Z",
        },
        mouth: {
          path: "M 40 72 Q 50 82 60 72",
          stroke: mergedColors.accent,
          fill: "none",
          strokeWidth: 3,
        },
      },
      sad: {
        eyes: {
          eyeLeftPath:
            "M 22 35 C 28 45, 38 45, 42 35 v 10 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
          eyeRightPath:
            "M 58 35 C 64 45, 74 45, 78 35 v 10 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
        },
        mouth: {
          path: "M 40 82 Q 50 72 60 82",
          stroke: mergedColors.accent,
          fill: "none",
          strokeWidth: 3,
        },
      },
      angry: {
        eyes: {
          eyeLeftPath: "M 15 35 H 45 L 40 50 H 20 Z",
          eyeRightPath: "M 55 35 H 85 L 80 50 H 60 Z",
          glassesPath: "M 45 35 H 55",
        },
        mouth: {
          path: "M 48 80 a 4 4 0 0 1 5 0 a 5 5 0 0 1 -5 0 Z",
          stroke: "none",
          fill: mergedColors.accent,
          strokeWidth: 0,
        },
      },
      surprised: {
        eyes: {
          eyeLeftPath:
            "M 22 30 a 5 5 0 0 1 5 -5 h 10 a 5 5 0 0 1 5 5 v 20 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
          eyeRightPath:
            "M 58 30 a 5 5 0 0 1 5 -5 h 10 a 5 5 0 0 1 5 5 v 20 a 5 5 0 0 1 -5 5 h -10 a 5 5 0 0 1 -5 -5 Z",
        },
        mouth: {
          path: "M 47 75 a 4 4 0 0 1 6 0 a 6 6 0 0 1 -6 0 Z",
          stroke: "none",
          fill: mergedColors.accent,
          strokeWidth: 0,
        },
      },
    };

    const styles = `
      .robot-face-container:focus {
        outline: 2px solid ${mergedColors.accent};
        outline-offset: 4px;
        border-radius: 4px;
      }
    `;

    const renderEyes = (expr) => {
      const style = expressionStyles[expr]?.eyes;
      if (!style) return null;
      return (
        <g
          style={{
            transform: isBlinking ? "scaleY(0.05)" : "scaleY(1)",
            transformOrigin: "center",
          }}
        >
          <path d={style.eyeLeftPath} fill={mergedColors.accent} />
          <path d={style.eyeRightPath} fill={mergedColors.accent} />
          {style.glassesPath && (
            <path
              d={style.glassesPath}
              stroke={mergedColors.accent}
              strokeWidth="3"
            />
          )}
        </g>
      );
    };

    const renderMouth = (expr) => {
      const style = expressionStyles[expr]?.mouth;
      if (!style) return null;
      const mouthScale = 1 + Math.max(0, Math.min(1, mouthValue / 100)) * 0.5;
      return (
        <g
          style={{
            transform: `scaleY(${mouthScale})`,
            transformOrigin: "center 78px",
          }}
        >
          <path
            d={style.path}
            stroke={style.stroke}
            fill={style.fill}
            strokeWidth={style.strokeWidth}
            strokeLinecap="round"
          />
        </g>
      );
    };

    return (
      <>
        <style>{styles}</style>
        <div
          ref={faceRef}
          className="robot-face-container"
          style={{
            width: "100vw",
            height: "100vh",
            cursor: "pointer",
            touchAction: "none",
            backgroundColor: mergedColors.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
          onClick={() => cycleExpression(1)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="img"
          aria-label={`A robot face with a ${expression} expression.`}
        >
          <svg viewBox="0 0 100 100" width="80%" height="80%">
            {/* Eyes */}
            <g>{renderEyes(expression)}</g>

            {/* Mouth */}
            <g>{renderMouth(expression)}</g>
          </svg>
        </div>
      </>
    );
  }
);

RobotFace.displayName = "RobotFace";

RobotFace.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialExpression: PropTypes.oneOf([
    "neutral",
    "happy",
    "sad",
    "angry",
    "surprised",
  ]),
  expression: PropTypes.oneOf([
    "neutral",
    "happy",
    "sad",
    "angry",
    "surprised",
  ]),
  colorPalette: PropTypes.shape({
    background: PropTypes.string,
    accent: PropTypes.string,
  }),
  autoBlink: PropTypes.bool,
  onExpressionChange: PropTypes.func,
  mouthValue: PropTypes.number,
};

export default RobotFace;
