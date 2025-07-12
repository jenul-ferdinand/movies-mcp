import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExtendedEnv, McpResponse, Props, createErrorResponse } from "../types";
import { z, ZodRawShape } from 'zod';

const MovieTimeframeInput: ZodRawShape = {
  timeframe: z
    .enum(["day", "week"])
    .default("day")
    .describe("Timeframe for trending movies (day or week)")
};

const MovieSearchInput: ZodRawShape = {
    search: z
        .string()
        .min(1, "Search query cannot be empty")
        .describe("Search query for your movie by title")
}

export function registerMoviesTools(server: McpServer, env: ExtendedEnv, props: Props) {
    // Check if TMDB API key exists in environment
    if (!env.TMDB_API_KEY) {
        return createErrorResponse('TMDB API key not configured', {
            configIssue: 'Missing TMDB_API_KEY in environment variables'
        });
    }

    // Tool 2: Search Movies
    // @ts-expect-error
    server.tool(
        'searchMovies',
        'Search for a movie by its title, show top 10 results',
        MovieSearchInput,
        async ({ search }: any) => {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(search)}`
                );
                    
                if (!response.ok) {
                    return createErrorResponse('TMDB API request failed', {
                        status: response.status,
                        statusText: response.statusText
                    });
                }

                const data: any = await response.json();

                if (data.results.length === 0) {
                    return createErrorResponse('No movies found', {
                        searchQuery: search
                    });
                }

                // Extract top 10 results and format them
                const movies = data.results.slice(0, 10).map((movie: any) => ({
                    title: movie.title,
                    overview: movie.overview.substring(0, 100) + (movie.overview.length > 800 ? '...' : ''),
                    releaseDate: movie.release_date,
                    popularity: movie.popularity,
                    voteAverage: movie.vote_average
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: `**Top 10 Movie Results for "${search}":**\n\n` +
                                movies.map(
                                        (m: any, i: any) =>
                                            `${i + 1}. **${m.title}** (${m.releaseDate})\n` +
                                            `average rating: ${m.voteAverage}/10\n` +
                                            `popularity (out of 100): ${m.popularity.toFixed(1)}\n` +
                                            `description: ${m.overview}`
                                    )
                                    .join('\n\n')
                        }
                    ]
                }
            }
            catch (error) {
                console.error('Error during searchMovies:', error);
                return createErrorResponse('Failed to search for movies', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    )  
}