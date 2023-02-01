import solid from "solid-start/vite";
import vercel from './start-vercel';
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({adapter: vercel({edge:false })})],
});
