FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download || go mod tidy

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o billing-service ./cmd/main.go

# Final image
FROM alpine:latest

WORKDIR /app

# Copy binary
COPY --from=builder /app/billing-service .

# Copy config
COPY config.yaml .

EXPOSE 3005

CMD ["./billing-service"]