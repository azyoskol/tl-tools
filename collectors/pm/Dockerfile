FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .
COPY config.yaml .

CMD ["./collector"]