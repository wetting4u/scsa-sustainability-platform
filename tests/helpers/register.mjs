import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (
      specifier === "@/lib/supabase/server" ||
      (specifier === "./supabase/server" &&
        context.parentURL?.endsWith("/lib/api.ts"))
    )
      return {
        url: "data:text/javascript,export async function createClient(){return globalThis.__testSupabase;}",
        shortCircuit: true,
      };
    let url;
    if (specifier.startsWith("@/"))
      url = new URL("src/" + specifier.slice(2), root);
    else if (specifier.startsWith("."))
      url = new URL(specifier, context.parentURL);
    if (url?.protocol === "file:" && existsSync(fileURLToPath(url) + ".ts"))
      return {
        url: pathToFileURL(fileURLToPath(url) + ".ts").href,
        shortCircuit: true,
      };
    return next(specifier, context);
  },
});
