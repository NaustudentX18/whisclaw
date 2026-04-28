package main

import (
	"encoding/json"
	"net/http"
)

type Config struct {
	Model     ModelConfig     `json:"model"`
	Gateway   GatewayConfig   `json:"gateway"`
	MissionControl MissionControlConfig `json:"missionControl"`
}

type ModelConfig struct {
	Name       string `json:"name"`
	APIBase    string `json:"apiBase"`
	APIKey     string `json:"apiKey"`
	MaxTokens  int    `json:"maxTokens"`
	Temperature float64 `json:"temperature"`
}

type GatewayConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type MissionControlConfig struct {
	Port int    `json:"port"`
	PollInterval int `json:"pollInterval"`
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := map[string]string{
		"status": "online",
		"service": "whisclaw-mission-control",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		cfg, err := loadConfig("")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cfg)
		return
	}

	if r.Method == http.MethodPost {
		var cfg Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if err := saveConfig(cfg); err != nil {
			http.Error(w, "Failed to save configuration", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}