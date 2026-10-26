// Gera os cards do README com o github-readme-stats-core.
// Só grava o SVG quando a geração dá certo, para nunca publicar um card de erro.
import { writeFile } from "node:fs/promises";
import { api, topLangs } from "@stats-organization/github-readme-stats-core";

const user = process.env.GITHUB_REPOSITORY_OWNER;
const pat = process.env.STATS_TOKEN;
const style = "theme=tokyonight&hide_border=true&bg_color=0D1117&locale=pt-br";

const cards = [
  { path: "profile/stats.svg", render: api, options: `show_icons=true&count_private=true&include_all_commits=true&${style}` },
  { path: "profile/top-langs.svg", render: topLangs, options: `layout=compact&langs_count=8&${style}` },
];

let failed = false;
for (const card of cards) {
  const query = Object.fromEntries(new URLSearchParams(`username=${user}&${card.options}`));
  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    result = await card.render(query, pat);
    if (!String(result.status).startsWith("error")) break;
    console.warn(`${card.path}: tentativa ${attempt} falhou (${result.error?.message ?? result.status})`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
  if (String(result.status).startsWith("error")) {
    console.log(`::warning::${card.path} não foi gerado, mantendo a versão anterior`);
    failed = true;
    continue;
  }
  await writeFile(card.path, result.content, "utf8");
  console.log(`${card.path} atualizado`);
}
if (failed) process.exitCode = 0;
