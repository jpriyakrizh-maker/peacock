import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
} from "@react-three/drei";
import { Box3, MathUtils, Vector3 } from "three";
import "./app.css";

const MODEL_URL = `${import.meta.env.BASE_URL}phoenix_bird.glb`;
const TARGET_SIZE = 3;

function Peacock() {
  const group = useRef();
  const pivot = useRef();
  const fit = useRef();

  const initialized = useRef(false);
  const mouse = useRef({ x: 0, y: 0 });
  const speedRef = useRef(0);
  const previousPosition = useRef(new Vector3());

  const { scene, animations } = useGLTF(MODEL_URL);

  const { actions, names } = useAnimations(
    animations,
    group
  );

  // Play the first animation available in the GLB
  useEffect(() => {
    if (!names.length) return;

    const action = actions[names[0]];

    action?.reset().fadeIn(0.4).play();

    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names]);

  // Track cursor movement across the screen
  useEffect(() => {
    const handlePointerMove = (event) => {
      mouse.current.x =
        (event.clientX / window.innerWidth) * 2 - 1;

      mouse.current.y =
        -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    const p = pivot.current;
    const f = fit.current;

    if (!g || !p || !f) return;

    // Center and scale the model once
    if (!initialized.current) {
      const box = new Box3().setFromObject(scene);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());

      const maxSize = Math.max(
        size.x,
        size.y,
        size.z,
        0.001
      );

      const scale = TARGET_SIZE / maxSize;

      f.scale.setScalar(scale);

      f.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );

      previousPosition.current.copy(g.position);
      initialized.current = true;
    }

    const { x, y } = mouse.current;

    // Smoothly follow the cursor
    const targetX = x * 2;
    const targetY = y * 1.3;

    g.position.x = MathUtils.damp(
      g.position.x,
      targetX,
      3,
      delta
    );

    g.position.y = MathUtils.damp(
      g.position.y,
      targetY,
      3,
      delta
    );

    // Calculate actual movement direction
    const dx =
      g.position.x - previousPosition.current.x;

    const dy =
      g.position.y - previousPosition.current.y;

    speedRef.current =
      Math.sqrt(dx * dx + dy * dy) /
      Math.max(delta, 0.001);

    previousPosition.current.copy(g.position);

// Only turn left and right
 
// Cursor direction controls the whole Phoenix body
const targetYaw = x < 0 ? Math.PI : -Math.PI / 2;

p.rotation.y = MathUtils.damp(
  p.rotation.y,
  targetYaw,
  5,
  delta
);

p.rotation.x = 0;
p.rotation.z = 0;
});
  
    return (
    <group ref={group}>
      <group ref={pivot}>
        <group ref={fit}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

function Loader() {
  return null;
}

export default function App() {
  return (
    <main className="stage">
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 45,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color
          attach="background"
          args={["#03040a"]}
        />

        <ambientLight intensity={1.4} />

        <directionalLight
          position={[3, 5, 5]}
          intensity={2}
        />

        <directionalLight
          position={[-4, 2, -3]}
          intensity={1.5}
          color="#7c8dff"
        />

        <Suspense fallback={<Loader />}>
          <Peacock />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </main>
  );
}

useGLTF.preload(MODEL_URL);
