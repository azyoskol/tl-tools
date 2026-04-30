package biz

func getString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func getInt64(v any) int64 {
	switch n := v.(type) {
	case int64:
		return n
	case float64:
		return int64(n)
	case int:
		return int64(n)
	default:
		return 0
	}
}