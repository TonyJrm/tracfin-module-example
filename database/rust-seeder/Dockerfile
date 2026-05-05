# Build stage
FROM rust:latest AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
  pkg-config \
  libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml ./

# Copy source code
COPY src ./src

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /build/target/release/seeder /usr/local/bin/seeder

# Set environment variables
ENV DB_HOST=tracfin-db
ENV DB_PORT=5432
ENV DB_USER=tracfin_user
ENV DB_PASSWORD=tracfin_password
ENV DB_NAME=tracfin

# Run seeder
ENTRYPOINT ["/usr/local/bin/seeder"]
CMD ["40000"]
