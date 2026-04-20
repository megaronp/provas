# Skill: search_web

**Purpose**: Search the internet for documentation, examples, solutions to technical problems using Exa AI search API.

**Signature**:
```typescript
search_web(
  query: string,
  options?: {
    numResults?: number,     // Number of results (default 8, max 20)
    type?: "auto" | "fast" | "deep", // Search depth
    livecrawl?: "fallback" | "preferred", // Crawl strategy
    dateRange?: { from: string, to: string } // Time filter
  }
): Promise<WebSearchResults>
```

**Parameters**:
- `query` (string, required): Search query (natural language or keywords).
- `options.numResults` (number, optional): How many results to return (1-20).
- `options.type` (string, optional): Search type:
  - `"fast"` - quick results, less comprehensive
  - `"auto"` - balanced (default)
  - `"deep"` - thorough search, slower
- `options.livecrawl` (string, optional): 
  - `"fallback"` - use cache, live crawl if cache miss (default)
  - `"preferred"` - prioritize fresh live crawl
- `options.dateRange` (object, optional): Restrict to date range.

**Returns**:
```typescript
{
  query: string,
  results: Array<{
    title: string,
    url: string,
    snippet: string,         // Summary/description
    date?: string,           // Publication date if available
    source: string          // Domain name
  }>,
  totalResults: number
}
```

---

## Usage Examples

### General knowledge
```
search_web("how to create index in Supabase PostgreSQL")
→ Returns best practices and docs
```

### API documentation
```
search_web("Express.js 4.x error handling middleware best practices")
→ Tutorials and official docs
```

### Code examples
```
search_web("TypeScript Zod validation nested objects example")
→ Code snippets and patterns
```

### Troubleshooting error
```
search_web("Supabase error code PGRST116 meaning")
→ Explanation of PostgREST error codes
```

---

## Effective Search Queries

### Include tech stack keywords
```
"Supabase insert multiple rows TypeScript example"
```

### Ask for official docs
```
"Supabase JS client documentation insert query"
```

### Specific error messages
```
"PostgreSQL ERROR: column does not exist duplicate"
```

### Version-specific
```
"Express 4.x CORS configuration 2024"
```

---

## When to Use search_web

✅ **USE for**:
- Learning new technology (Supabase, Zod, etc.)
- Finding best practices for patterns
- Debugging unfamiliar errors
- Checking official documentation
- Discovering new libraries/tools

❌ **DON'T USE for**:
- Something already in project docs (check `PROJECT_CONTEXT.md` first)
- Information about the current codebase (use `search_code` or `read_file`)
- Common knowledge within the team (ask orchestrator)

---

## Interpreting Results

Results returned in order of relevance:

1. **Title**: Clickable link, indicates topic
2. **Snippet**: Brief summary, contains keywords
3. **URL**: Source domain (github.com, docs.supabase.com, stackoverflow.com)
4. **Date**: Freshness indicator (if available)

**Prioritize**:
- Official documentation (supabase.com, typescriptlang.org, expressjs.com)
- Recent articles (<2 years old)
- High-authority sources (GitHub repos, MDN, major blogs)

---

## Common Search Scenarios

### Finding docs
```
Query: "Supabase JS client from().select() examples"
→ Official Supabase JS reference
```

### Stack Overflow style
```
Query: "TypeScript error Type 'string' is not assignable to type 'number'"
→ StackOverflow thread with solution
```

### GitHub code search (specific repo)
```
Query: "site:github.com expressjs/express middleware example"
→ Finds code in specific repository
```

### Tutorial / Guide
```
Query: "typeorm vs supabase 2024 comparison"
→ Blog posts comparing tools
```

---

## Rate Limits & Cost

- **Rate Limit**: 10 searches per minute (soft limit)
- **Max results per call**: 20
- **Cost**: External API call (track usage)

Use sparingly - batch similar queries, don't spam.

---

## Limitations

- Results may be outdated (check date)
- AI-generated content may be inaccurate (cross-check with official docs)
- No guarantee of result quality (use judgment)
- Cannot access private/authenticated content

---

## Post-Search Workflow

1. Review top 3-5 results
2. Open most relevant URLs (with `webfetch` if needed)
3. Extract solution pattern
4. Adapt to ProvaSystem context
5. Apply change with `apply_change`
6. Test locally

---

## Example: Research → Implementation

**Task**: "Add Zod validation to prova creation"

1. `search_web("zod object validation nested arrays example")`
2. Read top result (Zod docs)
3. `write` validation schema in `src/utils/validators.ts`
4. `apply_change` to route to use new validator
5. `run_tests` verify
6. `commit_changes`

---

## Related Skills

- `webfetch`: Fetch content from a specific URL found via search
- `read_file`: Check if project already has solution before searching web
- `search_code`: Check existing code before web search

---

**Agent Access**: All agents (with approval for extensive use)
**Rate Limit**: 10 queries per minute
**Cost**: External API call (track usage)
**Safety**: Safe - only retrieves information, no modifications
