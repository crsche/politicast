import { z } from "zod";

export const NewsAPIEverything = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(
    z.object({
      source: z.object({
        id: z.string().nullable(),
        name: z.string(),
      }),

      author: z.string().nullable(),
      title: z.string(),
      description: z.string().nullable(),
      url: z.string().url(),
      urlToImage: z.string().nullable(),
      publishedAt: z.coerce.date(),
      content: z.string(),
    })
  ),
});

async function getArticles() {
  // See https://newsapi.org/docs/endpoints/everything
  const NEWSAPI_ENDPONT = "https://newsapi.org/v2/everything";
  const QUERY = "election";
  const AUTH = process.env.NEWSAPI_AUTH;
  if (!AUTH) {
    throw new Error("Missing NEWSAPI_AUTH environment variable");
  }
  const REQUESTS_PER_DAY = process.env.NEWSAPI_REQUESTS_PER_DAY
    ? parseInt(process.env.NEWSAPI_REQUESTS_PER_DAY)
    : 100;
  const cache_ms = (24 * 60 * 60 * 1000) / REQUESTS_PER_DAY;

  // TODO: Do we need to change the query?
  const response = await fetch(
    `${NEWSAPI_ENDPONT}?q=${QUERY}&language=en&apiKey=${AUTH}`,
    {
      next: { revalidate: cache_ms },
    }
  );

  const parsed = NewsAPIEverything.parse(await response.json());
  if (parsed.status !== "ok") {
    throw new Error("News API returned an error");
  }
  return parsed;
}

export default async function Home() {
  const articles = await getArticles();
  articles.articles.sort((b, a) => {
    return a.publishedAt.getTime() - b.publishedAt.getTime();
  });
  return (
    <main>
      {articles.articles.map((article) => (
        <p key={article.source.id}>
          {article.publishedAt.toDateString()} - {article.title}
        </p>
      ))}
    </main>
  );
}
