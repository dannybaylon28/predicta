import type { VercelRequest, VercelResponse } from "@vercel/node";

const COMPETITION = "2000"; // FIFA World Cup
const UPSTREAM = `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Falta FOOTBALL_DATA_TOKEN." });
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { "X-Auth-Token": token },
    });

    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: "football-data respondio con error.", status: upstream.status });
    }

    const data = await upstream.json();
    // Cache en el edge para no agotar el limite gratuito (10 req/min).
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json(data);
  } catch (error) {
    console.error("football-data", error);
    return res.status(502).json({ error: "No pudimos consultar football-data." });
  }
}
