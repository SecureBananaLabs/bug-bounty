func HandleRegister(w http.ResponseWriter, r *http.Request) {
	// Parse JSON body
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Role     string `json:"role"`
	}
	
	// Check if role is admin
	if req.Role == "admin" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Admins cannot self-assign admin privileges during registration"})
		return
	}
	
	// Proceed with regular registration logic
	// ...
}