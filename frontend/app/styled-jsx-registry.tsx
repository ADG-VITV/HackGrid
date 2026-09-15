"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

/**
 * Lets `<style jsx>` blocks (the navbar, the timeline) reach the server
 * render. Without a registry the App Router only injects them on the
 * client, so the first paint shows those components unstyled.
 * From node_modules/next/dist/docs/01-app/02-guides/css-in-js.md.
 */
export default function StyledJsxRegistry({ children }: { children: React.ReactNode }) {
  const [jsxStyleRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles();
    jsxStyleRegistry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={jsxStyleRegistry}>{children}</StyleRegistry>;
}
