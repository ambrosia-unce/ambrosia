export function appTest(): string {
  return `import { describe, it, expect } from "bun:test";

describe("App", () => {
  it("should respond to health check", async () => {
    const res = await fetch("http://localhost:3000/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("should list users", async () => {
    const res = await fetch("http://localhost:3000/api/users");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeArray();
    expect(body.count).toBeNumber();
  });

  it("should create a user", async () => {
    const res = await fetch("http://localhost:3000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alice", email: "alice@example.com" }),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.name).toBe("Alice");
    expect(body.data.email).toBe("alice@example.com");
    expect(body.data.id).toBeNumber();
  });
});
`;
}
