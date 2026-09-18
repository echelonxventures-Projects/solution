FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum* ./
RUN go mod download || go mod tidy

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o communication-service ./cmd/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/communication-service .
COPY config.yaml .

# Create recordings directory
RUN mkdir -p /var/consultancy/recordings

EXPOSE 3004

CMD ["./communication-service"]