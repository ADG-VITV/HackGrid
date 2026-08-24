"use client";

import { useEffect } from "react";

export default function Hero() {
  useEffect(() => {
    import("./three");
  }, []);

  return (
    <>
      <div className="gbg"></div>
      <div className="cf" id="cf"></div>

      <canvas id="c3d"></canvas>

      <div className="hero">
        <div className="lw" id="lw">
          <div className="logo-glow" id="logoGlow"></div>

          <img
            className="main-logo"
            id="logoImg"
            src="/logo.png"
            alt="HACKGRID 2026"
          />

          <div className="gl gl-r" id="gr">
            <img src="/logo.png" alt="" />
          </div>

          <div className="gl gl-c" id="gc">
            <img src="/logo.png" alt="" />
          </div>

          <div className="gl gl-w" id="gw">
            <img src="/logo.png" alt="" />
          </div>

          <div className="nb" id="n1"></div>
          <div className="nb" id="n2"></div>
          <div className="nb" id="n3"></div>

          <div className="es"></div>
        </div>
      </div>
    </>
  );
}