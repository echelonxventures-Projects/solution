FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum* ./
RUN go mod download || go mod tidy

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o search-service ./cmd/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/search-service .
COPY config.yaml .

EXPOSE 3009

CMD ["./search-service"]