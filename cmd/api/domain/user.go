package domain

type User struct {
    ID     string `json:"id"`
    Name   string `json:"name"`
    Email  string `json:"email"`
    Avatar string `json:"avatar"`
    Role   string `json:"role"`
}
