package auth

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/rs/zerolog/log"
)

type Claims struct {
    Sub   string
    Email string
    Role  string
}

type jwtClaims struct {
    jwt.RegisteredClaims
    Email string `json:"email"`
    Role  string `json:"role"`
}

type KeyManager struct {
    private *rsa.PrivateKey
}

func NewKeyManager(pemKey string) (*KeyManager, error) {
    if pemKey == "" {
        log.Warn().Msg("JWT_PRIVATE_KEY not set — generating RSA-2048 key, tokens invalidated on restart")
        key, err := rsa.GenerateKey(rand.Reader, 2048)
        if err != nil {
            return nil, fmt.Errorf("generate rsa key: %w", err)
        }
        return &KeyManager{private: key}, nil
    }

    block, _ := pem.Decode([]byte(pemKey))
    if block == nil {
        return nil, fmt.Errorf("invalid PEM block")
    }
    key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
    if err != nil {
        return nil, fmt.Errorf("parse private key: %w", err)
    }
    return &KeyManager{private: key}, nil
}

func (km *KeyManager) Sign(c Claims, ttl time.Duration) (string, error) {
    now := time.Now()
    token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwtClaims{
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   c.Sub,
            IssuedAt:  jwt.NewNumericDate(now),
            ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
        },
        Email: c.Email,
        Role:  c.Role,
    })
    return token.SignedString(km.private)
}

func (km *KeyManager) Validate(tokenStr string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &jwtClaims{}, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("unexpected signing method")
        }
        return &km.private.PublicKey, nil
    })
    if err != nil {
        return nil, err
    }
    claims, ok := token.Claims.(*jwtClaims)
    if !ok || !token.Valid {
        return nil, fmt.Errorf("invalid token")
    }
    return &Claims{Sub: claims.Subject, Email: claims.Email, Role: claims.Role}, nil
}
