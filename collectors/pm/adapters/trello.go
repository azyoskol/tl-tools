package adapters

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type TrelloAdapter struct {
	APIKey string
	Token  string
}

type TrelloCard struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	DateLastActive time.Time `json:"dateLastActive"`
	IDList          string    `json:"idList"`
}

func NewTrelloAdapter() *TrelloAdapter {
	return &TrelloAdapter{
		APIKey: os.Getenv("TRELLO_API_KEY"),
		Token:  os.Getenv("TRELLO_TOKEN"),
	}
}

func (t *TrelloAdapter) Fetch() ([]TrelloCard, error) {
	url := "https://api.trello.com/1/members/me/cards?key=" + t.APIKey + "&token=" + t.Token
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var cards []TrelloCard
	json.NewDecoder(resp.Body).Decode(&cards)
	
	return cards, nil
}

func (t *TrelloAdapter) Transform(card TrelloCard) Event {
	eventType := "card_updated"
	
	payload, _ := json.Marshal(map[string]string{
		"card_id": card.ID,
		"name":    card.Name,
	})
	
	return Event{
		SourceType: "pm",
		EventType:  eventType,
		TeamID:     os.Getenv("TEAM_ID"),
		Payload:    string(payload),
		OccurredAt: card.DateLastActive,
	}
}