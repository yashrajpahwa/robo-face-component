import { useEffect, useState } from "react";
import RobotFace from "./Face";

const App = () => {
  const [expression, setExpression] = useState("neutral");
  const [mouthValue, setMouthValue] = useState(0);
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);

  // for Demo
  useEffect(() => {
    const expressions = ["neutral", "happy", "sad", "surprised"];
    let expressionIndex = 0;

    const expressionInterval = setInterval(() => {
      expressionIndex = (expressionIndex + 1) % expressions.length;
      setExpression(expressions[expressionIndex]);
    }, 2000);

    const animationFrame = requestAnimationFrame(function animate() {
      setPupilX(Math.sin(Date.now() * 0.1));
      setPupilY(Math.cos(Date.now() * 0.15));

      const currentExpression = expressions[expressionIndex];
      if (currentExpression === "surprised") {
        setMouthValue(Math.abs(Math.sin(Date.now() * 0.002)) * 100);
      } else if (currentExpression === "happy") {
        setMouthValue((Math.sin(Date.now() * 0.002) * 0.5 + 0.5) * 50); // Gentle wave from 0 to 50
      } else {
        setMouthValue(0);
      }
      requestAnimationFrame(animate);
    });

    return () => {
      clearInterval(expressionInterval);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <RobotFace
      expression={expression}
      mouthValue={mouthValue}
      pupilX={pupilX}
      pupilY={pupilY}
    />
  );
};

export default App;
