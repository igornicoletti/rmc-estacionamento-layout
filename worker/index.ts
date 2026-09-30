const apiHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/problem+json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
}

function problem(status: number, title: string, type: string) {
  return Response.json(
    {
      status,
      title,
      type,
    },
    { headers: apiHeaders, status },
  )
}

export default {
  fetch(request: Request) {
    const { pathname } = new URL(request.url)

    if (pathname === "/api/health") {
      return Response.json(
        { status: "ok" },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      )
    }

    if (pathname.startsWith("/api/")) {
      return problem(
        503,
        "Authentication API is not available",
        "urn:rmc:problem:auth-disabled",
      )
    }

    return problem(404, "Not found", "about:blank")
  },
}
