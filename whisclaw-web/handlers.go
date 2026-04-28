package main

import (
	"encoding/json"
	"net/http"
)

// handleStatus returns system status
func handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := getSystemStatus()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleConfig handles config CRUD operations
func handleConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		cfg := getConfig()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cfg)

	case http.MethodPost:
		var cfg Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if err := saveConfig(cfg); err != nil {
			http.Error(w, "Failed to save config", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleCron handles cron job CRUD operations
func handleCron(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		jobs := ListCronJobs()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(jobs)

	case http.MethodPost:
		var job CronJob
		if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if err := CreateCronJob(job); err != nil {
			http.Error(w, "Failed to create cron job", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "created"})

	case http.MethodDelete:
		// Extract ID from path /api/cron/:id
		id := extractID(r.URL.Path)
		if id == "" {
			http.Error(w, "Missing job ID", http.StatusBadRequest)
			return
		}
		if err := DeleteCronJob(id); err != nil {
			http.Error(w, "Failed to delete cron job", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleCalendar handles calendar event CRUD operations
func handleCalendar(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		events := ListCalendarEvents()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(events)

	case http.MethodPost:
		var event CalendarEvent
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if err := CreateCalendarEvent(event); err != nil {
			http.Error(w, "Failed to create event", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "created"})

	case http.MethodDelete:
		id := extractID(r.URL.Path)
		if id == "" {
			http.Error(w, "Missing event ID", http.StatusBadRequest)
			return
		}
		if err := DeleteCalendarEvent(id); err != nil {
			http.Error(w, "Failed to delete event", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleSkills returns available skills
func handleSkills(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	skills := ListSkills()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(skills)
}

// extractID extracts the ID from a URL path like /api/cron/:id
func extractID(path string) string {
	// Simple extraction - grab last segment after final /
	var id string
	for i := len(path) - 1; i >= 0; i-- {
		if path[i] == '/' {
			id = path[i+1:]
			break
		}
	}
	return id
}
