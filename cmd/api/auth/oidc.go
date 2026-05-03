package auth

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type OIDCProvider struct {
	verifier *oidc.IDTokenVerifier
	config   oauth2.Config
}

func NewOIDCProvider(issuer, clientID, clientSecret, redirectURL string) (*OIDCProvider, error) {
	if issuer == "" {
		return nil, fmt.Errorf("OIDC issuer not configured")
	}
	ctx := context.Background()
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, err
	}
	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})
	cfg := oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}
	return &OIDCProvider{verifier: verifier, config: cfg}, nil
}

func (p *OIDCProvider) VerifyIDToken(ctx context.Context, rawIDToken string) (string, error) {
	token, err := p.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", err
	}
	var claims struct{ Email string `json:"email"` }
	if err := token.Claims(&claims); err != nil {
		return "", err
	}
	return claims.Email, nil
}
