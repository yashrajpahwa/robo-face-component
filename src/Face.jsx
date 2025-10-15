import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import PropTypes from "prop-types";
import { useSpring, animated, config } from "@react-spring/web";
import { interpolate } from "flubber"; // Added for smooth path morphing

// --- Custom Hooks ---
// Re-added to track the previous expression for smooth interpolation
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
    const prevExpression = usePrevious(expression);

    const faceRef = useRef(null);
    const blinkTimeoutRef = useRef(null);

    const mergedColors = {
      background: "#000000",
      accent: "#00D0FF",
      ...colorPalette,
    };

    // --- Hooks & Effects ---
    useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = () => setPrefersReducedMotion(mediaQuery.matches);
      handler();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    // Effect to blink when expression changes, making the transition feel more natural
    useEffect(() => {
      if (
        prevExpression &&
        prevExpression !== expression &&
        !prefersReducedMotion &&
        autoBlink
      ) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, [expression, prevExpression, prefersReducedMotion, autoBlink]);

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
          setTimeout(() => setIsBlinking(false), 150);
          scheduleBlink();
        }, nextBlink);
      };
      scheduleBlink();
      return () => clearTimeout(blinkTimeoutRef.current);
    }, [autoBlink, prefersReducedMotion]);

    // --- Event Handlers ---
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

    // --- SVG Path Data ---
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

    // --- Animations ---
    const fromExpression = prevExpression || initialExpression;
    const toExpression = expression;

    // Refined animation config for a more natural feel
    const naturalAnimationConfig = {
      mass: 1,
      tension: 120,
      friction: 22,
      immediate: prefersReducedMotion,
    };

    const { t } = useSpring({
      from: { t: 0 },
      to: { t: 1 },
      key: toExpression, // Re-run animation when expression changes
      config: naturalAnimationConfig,
    });

    // Create interpolators for smooth path morphing
    const interpolators = {
      eyeLeft: interpolate(
        expressionStyles[fromExpression].eyes.eyeLeftPath,
        expressionStyles[toExpression].eyes.eyeLeftPath
      ),
      eyeRight: interpolate(
        expressionStyles[fromExpression].eyes.eyeRightPath,
        expressionStyles[toExpression].eyes.eyeRightPath
      ),
      glasses: interpolate(
        expressionStyles[fromExpression].eyes.glassesPath || "M 50 42 H 50",
        expressionStyles[toExpression].eyes.glassesPath || "M 50 42 H 50"
      ),
      mouth: interpolate(
        expressionStyles[fromExpression].mouth.path,
        expressionStyles[toExpression].mouth.path
      ),
    };

    const animatedProps = useSpring({
      to: {
        glassesOpacity: expressionStyles[toExpression].eyes.glassesPath ? 1 : 0,
        mouthStroke: expressionStyles[toExpression].mouth.stroke,
        mouthFill: expressionStyles[toExpression].mouth.fill,
        mouthStrokeWidth: expressionStyles[toExpression].mouth.strokeWidth,
      },
      from: {
        glassesOpacity: expressionStyles[fromExpression].eyes.glassesPath
          ? 1
          : 0,
        mouthStroke: expressionStyles[fromExpression].mouth.stroke,
        mouthFill: expressionStyles[fromExpression].mouth.fill,
        mouthStrokeWidth: expressionStyles[fromExpression].mouth.strokeWidth,
      },
      key: toExpression,
      config: naturalAnimationConfig,
    });

    const blinkSpring = useSpring({
      transform: isBlinking ? "scaleY(0.05)" : "scaleY(1)",
      config: prefersReducedMotion
        ? { duration: 0 }
        : { tension: 800, friction: 40 },
    });

    const mouthScale = 1 + Math.max(0, Math.min(1, mouthValue / 100)) * 0.5;
    const mouthTransformSpring = useSpring({
      transform: `scaleY(${mouthScale})`,
      config: naturalAnimationConfig,
    });

    const styles = `
      .robot-face-container:focus {
        outline: 2px solid ${mergedColors.accent};
        outline-offset: 4px;
        border-radius: 4px;
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
          <svg
            viewBox="0 0 100 100"
            width="100vw"
            height="100vh"
            aria-hidden="true"
          >
            <animated.g style={{ ...blinkSpring, transformOrigin: "center" }}>
              <animated.path
                d={t.to(interpolators.eyeLeft)}
                fill={mergedColors.accent}
              />
              <animated.path
                d={t.to(interpolators.eyeRight)}
                fill={mergedColors.accent}
              />
              <animated.path
                d={t.to(interpolators.glasses)}
                style={{ opacity: animatedProps.glassesOpacity }}
                stroke={mergedColors.accent}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </animated.g>
            <animated.g
              style={{
                ...mouthTransformSpring,
                transformOrigin: "center 78px",
              }}
            >
              <animated.path
                d={t.to(interpolators.mouth)}
                stroke={animatedProps.mouthStroke}
                fill={animatedProps.mouthFill}
                strokeWidth={animatedProps.mouthStrokeWidth}
                strokeLinecap="round"
              />
            </animated.g>
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
