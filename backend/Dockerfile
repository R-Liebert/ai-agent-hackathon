FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a separate volume
ENV UV_LINK_MODE=copy

WORKDIR /app

# Copy configuration files first for better caching
COPY pyproject.toml /app/

# Install the project's dependencies
# We don't mount uv.lock here to avoid build failures if it hasn't been generated yet
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project --no-dev

# Then, install the rest of the project
ADD . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev

# Final stage
FROM python:3.11-slim-bookworm

WORKDIR /app

# Copy the environment, but not the source code
COPY --from=builder /app/.venv /app/.venv

# Copy the source code
COPY . /app

# Run the application
ENV PATH="/app/.venv/bin:$PATH"
# Ensure the backend uses the service name 'neo4j' when inside Docker
ENV NEO4J_URI="bolt://neo4j:7687"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
