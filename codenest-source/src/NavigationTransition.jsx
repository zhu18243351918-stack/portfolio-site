import { useEffect, useRef, useState } from "react";
import { PAGE_TRANSITION_EVENT } from "./pageTransition";
import "./NavigationTransition.css";

const COVER_DURATION = 460;
const HOLD_DURATION = 180;
const REVEAL_DURATION = 680;

export default function NavigationTransition({ onNavigate }) {
  const [phase, setPhase] = useState("idle");
  const phaseRef = useRef("idle");
  const timersRef = useRef([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
    };

    const handleTransition = (event) => {
      const destination = event.detail;
      if (!destination?.href || phaseRef.current !== "idle") return;

      clearTimers();
      phaseRef.current = "covering";
      setPhase("covering");

      schedule(() => {
        phaseRef.current = "covered";
        setPhase("covered");
        onNavigate(destination);

        schedule(() => {
          phaseRef.current = "revealing";
          setPhase("revealing");

          schedule(() => {
            phaseRef.current = "idle";
            setPhase("idle");
          }, REVEAL_DURATION);
        }, HOLD_DURATION);
      }, COVER_DURATION);
    };

    window.addEventListener(PAGE_TRANSITION_EVENT, handleTransition);
    return () => {
      window.removeEventListener(PAGE_TRANSITION_EVENT, handleTransition);
      clearTimers();
    };
  }, [onNavigate]);

  const isActive = phase !== "idle";

  return (
    <div
      className={`page-transition page-transition--${phase}`}
      role="status"
      aria-live="polite"
      aria-hidden={!isActive}
    >
      <div className="page-transition__content">
        <div className="banter-loader" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <div className="banter-loader__box" key={index} />
          ))}
        </div>
        <p className="page-transition__label">Anthony / Portfolio</p>
      </div>
    </div>
  );
}
