# Skill: webfetch

**Purpose**: Fetch content from a specific URL (webpage, documentation, raw file) to read and analyze.

**Signature**:
```typescript
webfetch(
  url: string,
  options?: {
    format?: "markdown" | "text" | "html",  // Response format (default: markdown)
    timeout?: number,    // Request timeout in ms (default: 30000)
    headers?: Record<string, string>  // Custom headers
  }
): Promise<FetchedContent>
```

**Parameters**:
- `url` (string, required): Full URL to fetch (must be absolute with protocol).
- `options.format` (string, optional): Desired output format:
  - `"markdown"` - HTML converted to markdown (default)
  - `"text"` - Plain text stripping HTML
  - `"html"` - Raw HTML (for parsing)
- `options.timeout` (number, optional): Timeout in milliseconds (default 30s).
- `options.headers` (object, optional): Additional HTTP headers.

**Returns**:
```typescript
{
  url: string,
  status: number,          // HTTP status code (200, 404, etc.)
  contentType: string,     // MIME type
  content: string,         // Body (converted per format option)
  headers: Record<string, string>
}
```

---

## Usage Examples

### Fetch documentation page
```
webfetch("https://supabase.com/docs/reference/javascript/insert")
→ Returns markdown content of the page
```

### Fetch raw GitHub file
```
webfetch("https://raw.githubusercontent.com/example/repo/main/README.md")
→ Gets raw file content from a repo
```

### Fetch with custom headers
```
webfetch("https://api.example.com/data", {
  headers: { "Authorization": "Bearer token" }
})
→ Authenticated request
```

---

## Common Use Cases

- Read official API documentation (Supabase, Express, Zod)
- Check changelogs of dependencies
- Download example code from GitHub Gists or repos
- Validate configuration examples from docs
- Retrieve npm package README from registry

---

## Format Options

### markdown (default)
Converts HTML to readable markdown:
- `<h1>` → `#`
- `<code>` → backticks
- Strips ads/navigation

Best for: Documentation pages.

### text
Plain text extraction (strips all HTML tags).

Best for: Simple pages, logs.

### html
Raw HTML source.

Best for: Parsing structured data (links, code blocks).

---

## Security & Safety

### URL Validation
- Only HTTP/HTTPS protocols allowed
- Blocks `file://`, `ftp://`, `javascript:` URLs
- Max redirects: 5 (prevents loops)

### Timeout
- Default 30 seconds
- Long downloads may be interrupted (adjust if needed)

### Size Limits
- Max 5MB response body (prevents memory issues)
- Large files should be streamed (different approach needed)

---

## Best Practices

✅ **DO**:
- Prefer official documentation URLs
- Check URL accessibility first (some sites block bots)
- Use `format: "markdown"` for docs (cleaner)
- Cache results if fetching same URL repeatedly
- Respect `robots.txt` and terms of service

❌ **DO NOT**:
- Don't fetch private/authenticated content without credentials
- Don't scrape large sites aggressively (rate limits)
- Don't use for large file downloads (use `curl` or similar)
- Don't fetch executable/binaries (binary content may fail)

---

## Example: Implement Zod Validation

```
1. search_web("zod zod.object() required fields example")
→ Finds: https://zod.dev/

2. webfetch("https://zod.dev/#/types/object?id=object")
→ Reads schema definition examples

3. Apply pattern to project:
   Write validators using Zod object schemas
```

---

## Error Handling

Possible errors:
- `NetworkError`: DNS failure, connection refused
- `TimeoutError`: Request took too long
- `HTTPError`: Non-2xx status (404, 500, etc.)
- `TooLargeError`: Response exceeds 5MB limit
- `InvalidURLError`: Malformed URL

**Handle gracefully**:
```typescript
try {
  const doc = await webfetch(url);
  // Parse content
} catch (error) {
  if (error instanceof HTTPError && error.status === 404) {
    // Page not found - try alternative source
  } else {
    throw error; // Re-raise for orchestrator
  }
}
```

---

## Rate Limiting

- Max 20 fetches per minute
- Concurrent limit: 5 simultaneous requests

If rate-limited:
- Wait before retrying
- Batch requests sequentially

---

## Caching Strategy (Future)

Results could be cached in memory:
- Same URL within 5 minutes → return cached
- Invalidation via `cache.clear(url)`

Currently: No persistent cache (fetch each time).

---

## Integration with search_web

Common pattern:
```
search_results = await search_web("Supabase RLS policies guide")
for (const result of search_results.results) {
  content = await webfetch(result.url)
  // Analyze docs
}
```

---

## Related Skills

- `search_web`: Use first to discover URLs, then `webfetch` to read them
- `read_file`: For local files (faster, no network)
- `search_code`: For existing code patterns in project

---

**Agent Access**: All agents (rarely used, research only)
**Rate Limit**: 20 requests per minute
**Safety**: Safe - read-only external fetch
