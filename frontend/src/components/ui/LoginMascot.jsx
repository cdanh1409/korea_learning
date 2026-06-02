import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";

export default function LoginMascot({ showPassword }) {
  const { rive, RiveComponent } = useRive({
    src: "/animations/muza.riv",
    stateMachines: "State Machine 1",
    autoplay: false, // ❗ FIX CHÍNH: không autoplay nữa
  });

  // ===============================
  // UPDATE STATE MACHINE INPUT
  // ===============================
  useEffect(() => {
    if (!rive) return;

    const inputs = rive.stateMachineInputs("State Machine 1");
    if (!inputs) return;

    const chinHold = inputs.find((i) => i.name === "Chin hold");

    if (chinHold) {
      chinHold.value = Boolean(showPassword);
    }
  }, [rive, showPassword]);

  // ===============================
  // OPTIONAL: safe start on first interaction
  // ===============================
  useEffect(() => {
    const startRiveOnUserGesture = () => {
      if (!rive) return;

      // start state machine safely after gesture
      rive.play("State Machine 1");
    };

    window.addEventListener("pointerdown", startRiveOnUserGesture, {
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", startRiveOnUserGesture);
    };
  }, [rive]);

  return (
    <div
      style={{ width: "100%", height: "320px" }}
      onPointerDown={() => rive?.play("State Machine 1")}
    >
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
