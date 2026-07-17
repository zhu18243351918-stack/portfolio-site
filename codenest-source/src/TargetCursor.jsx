import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./TargetCursor.css";

const RESTING_POSITIONS = [
  { x: -18, y: -18 },
  { x: 6, y: -18 },
  { x: 6, y: 6 },
  { x: -18, y: 6 },
];

export default function TargetCursor({
  targetSelector = ".cursor-target",
  spinDuration = 3.2,
  hoverDuration = 0.38,
  parallaxOn = true,
  cursorColor = "#f1efe4",
  cursorColorOnTarget = "#e5ff48",
}) {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const activeTargetRef = useRef(null);
  const cornersRef = useRef([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine) and (hover: hover) and (min-width: 769px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(pointerQuery.matches && !motionQuery.matches);

    update();
    pointerQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      pointerQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !cursorRef.current || !dotRef.current) return undefined;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const corners = cornersRef.current.filter(Boolean);
    const previousCursor = document.body.style.cursor;
    let leaveTarget = () => undefined;
    let spinTween;
    let tickerActive = false;

    document.body.classList.add("target-cursor-enabled");
    document.body.style.cursor = "none";

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      autoAlpha: 0,
    });
    gsap.set(dot, { backgroundColor: cursorColor });
    corners.forEach((corner, index) => {
      gsap.set(corner, {
        x: RESTING_POSITIONS[index].x,
        y: RESTING_POSITIONS[index].y,
        borderColor: cursorColor,
      });
    });

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power3.out" });

    const startSpin = () => {
      spinTween?.kill();
      spinTween = gsap.to(cursor, {
        rotation: "+=360",
        duration: spinDuration,
        ease: "none",
        repeat: -1,
      });
    };

    const targetCorners = () => {
      const target = activeTargetRef.current;
      if (!target) return null;

      const rect = target.getBoundingClientRect();
      const cursorX = Number(gsap.getProperty(cursor, "x")) || 0;
      const cursorY = Number(gsap.getProperty(cursor, "y")) || 0;
      const pointerX = Number(gsap.getProperty(cursor, "x")) || rect.left + rect.width / 2;
      const pointerY = Number(gsap.getProperty(cursor, "y")) || rect.top + rect.height / 2;
      const parallaxX = parallaxOn ? Math.max(-2.5, Math.min(2.5, (pointerX - (rect.left + rect.width / 2)) / 90)) : 0;
      const parallaxY = parallaxOn ? Math.max(-2.5, Math.min(2.5, (pointerY - (rect.top + rect.height / 2)) / 90)) : 0;

      return [
        { x: rect.left - 3 - cursorX - parallaxX, y: rect.top - 3 - cursorY - parallaxY },
        { x: rect.right + 3 - 12 - cursorX + parallaxX, y: rect.top - 3 - cursorY - parallaxY },
        { x: rect.right + 3 - 12 - cursorX + parallaxX, y: rect.bottom + 3 - 12 - cursorY + parallaxY },
        { x: rect.left - 3 - cursorX - parallaxX, y: rect.bottom + 3 - 12 - cursorY + parallaxY },
      ];
    };

    const syncTarget = () => {
      const positions = targetCorners();
      if (!positions) return;
      corners.forEach((corner, index) => {
        gsap.to(corner, {
          x: positions[index].x,
          y: positions[index].y,
          duration: parallaxOn ? 0.16 : 0,
          ease: parallaxOn ? "power2.out" : "none",
          overwrite: "auto",
        });
      });
    };

    const stopTicker = () => {
      if (!tickerActive) return;
      gsap.ticker.remove(syncTarget);
      tickerActive = false;
    };

    leaveTarget = () => {
      if (!activeTargetRef.current) return;
      activeTargetRef.current = null;
      stopTicker();
      gsap.to(dot, { backgroundColor: cursorColor, duration: 0.18, ease: "power2.out" });
      gsap.to(corners, { borderColor: cursorColor, duration: 0.18, ease: "power2.out" });
      corners.forEach((corner, index) => {
        gsap.to(corner, {
          x: RESTING_POSITIONS[index].x,
          y: RESTING_POSITIONS[index].y,
          duration: 0.32,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      startSpin();
    };

    const enterTarget = (target) => {
      if (activeTargetRef.current === target) return;
      leaveTarget();
      activeTargetRef.current = target;
      spinTween?.pause();
      gsap.to(cursor, { rotation: 0, duration: 0.24, ease: "power2.out" });
      gsap.to(dot, { backgroundColor: cursorColorOnTarget, duration: 0.18 });
      gsap.to(corners, { borderColor: cursorColorOnTarget, duration: 0.18 });

      const positions = targetCorners();
      corners.forEach((corner, index) => {
        gsap.to(corner, {
          x: positions[index].x,
          y: positions[index].y,
          duration: hoverDuration,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      if (!tickerActive) {
        gsap.ticker.add(syncTarget);
        tickerActive = true;
      }
    };

    const handlePointerMove = (event) => {
      const pointedElement = document.elementFromPoint(event.clientX, event.clientY);
      const nativeArea = pointedElement?.closest(".editor-surface");
      xTo(event.clientX);
      yTo(event.clientY);

      if (nativeArea) {
        leaveTarget();
        gsap.to(cursor, { autoAlpha: 0, duration: 0.15 });
        return;
      }

      gsap.to(cursor, { autoAlpha: 1, duration: 0.15 });
      const target = pointedElement?.closest(targetSelector);
      if (target) enterTarget(target);
      else leaveTarget();
    };

    const handleScroll = () => {
      if (!activeTargetRef.current) return;
      const cursorX = Number(gsap.getProperty(cursor, "x")) || 0;
      const cursorY = Number(gsap.getProperty(cursor, "y")) || 0;
      const element = document.elementFromPoint(cursorX, cursorY);
      if (!element || element.closest(targetSelector) !== activeTargetRef.current) leaveTarget();
    };

    const handlePointerDown = () => {
      gsap.to(cursor, { scale: 0.88, duration: 0.16, ease: "power2.out" });
      gsap.to(dot, { scale: 0.65, duration: 0.16, ease: "power2.out" });
    };
    const handlePointerUp = () => {
      gsap.to(cursor, { scale: 1, duration: 0.24, ease: "power3.out" });
      gsap.to(dot, { scale: 1, duration: 0.24, ease: "power3.out" });
    };
    const handleWindowLeave = (event) => {
      if (event.relatedTarget === null) gsap.to(cursor, { autoAlpha: 0, duration: 0.15 });
    };

    startSpin();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("mouseout", handleWindowLeave);

    return () => {
      stopTicker();
      spinTween?.kill();
      gsap.killTweensOf([cursor, dot, ...corners]);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("mouseout", handleWindowLeave);
      activeTargetRef.current = null;
      document.body.classList.remove("target-cursor-enabled");
      document.body.style.cursor = previousCursor;
    };
  }, [cursorColor, cursorColorOnTarget, enabled, hoverDuration, parallaxOn, spinDuration, targetSelector]);

  if (!enabled) return null;

  return (
    <div ref={cursorRef} className="target-cursor-wrapper" aria-hidden="true">
      <span ref={dotRef} className="target-cursor-dot" />
      <span ref={(node) => { cornersRef.current[0] = node; }} className="target-cursor-corner corner-tl" />
      <span ref={(node) => { cornersRef.current[1] = node; }} className="target-cursor-corner corner-tr" />
      <span ref={(node) => { cornersRef.current[2] = node; }} className="target-cursor-corner corner-br" />
      <span ref={(node) => { cornersRef.current[3] = node; }} className="target-cursor-corner corner-bl" />
    </div>
  );
}
