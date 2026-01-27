import { render, startPreview, useFrame } from "../lib/engine.ts";
import { Spring } from "../lib/spring.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4
};

// We need a persistent state for the spring simulation
// Since amethyst is deterministic and purely functional per frame *by default*, 
// stateful simulations need a way to pre-calculate or re-calculate.
// 
// For this demo, we'll re-run the simulation from frame 0 up to current frame inside the component.
// In a real optimized engine, we'd cache this or use a hook that handles memoization.

function simulateSpring(frame, targetFn) {
  const spring = new Spring(0, { tension: 120, friction: 14 });
  for (let i = 0; i <= frame; i++) {
    spring.set(targetFn(i));
    spring.update(1/30);
  }
  return spring.get();
}

function SpringSketch() {
  const frame = useFrame();
  
  // Target position jumps at frame 30 and 90
  const targetX = (f) => {
      if (f > 90) return 400;
      if (f > 30) return -400;
      return 0;
  };
  
  const x = simulateSpring(frame, targetX);
  
  // Another spring for skew
  const skewSpring = new Spring(0, { tension: 200, friction: 10 });
  // Skew reacts to velocity roughly (or just animate it)
  // Let's just animate skew target
  const targetSkew = (f) => (f > 60 && f < 80) ? 20 : 0;
  
  for (let i = 0; i <= frame; i++) {
      skewSpring.set(targetSkew(i));
      skewSpring.update(1/30);
  }
  const skewVal = skewSpring.get();

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 200, height: 200,
          backgroundColor: "#8b5cf6",
          borderRadius: 20,
          // Apply Spring Position
          marginLeft: x,
          
          // Apply Skew Spring
          skewX: skewVal,
          
          justifyContent: "center", alignItems: "center"
        },
        children: [
            {
                tag: "text",
                text: "SPRING",
                style: { color: "#fff", fontSize: 40 }
            }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(SpringSketch, config, "spring_demo.mp4");
} else {
  startPreview(SpringSketch, config);
}