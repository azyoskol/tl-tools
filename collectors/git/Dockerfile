FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .

CMD ["./collector"]