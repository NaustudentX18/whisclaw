package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type CalendarEvent struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Reminder    int       `json:"reminder"`
	CreatedAt   time.Time `json:"createdAt"`
}

var calendarEvents []CalendarEvent
var calendarMutex sync.Mutex

func handleCalendar(w http.ResponseWriter, r *http.Request) {
	calendarFile := filepath.Join(os.Getenv("HOME"), ".whisclaw", "calendar.json")

	switch r.Method {
	case http.MethodGet:
		if err := loadCalendarEvents(calendarFile); err != nil {
			log.Printf("Failed to load calendar events: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(calendarEvents)
		return

	case http.MethodPost:
		var event CalendarEvent
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		event.ID = fmt.Sprintf("event-%d", time.Now().UnixNano())
		event.CreatedAt = time.Now()
		calendarEvents = append(calendarEvents, event)

		if err := saveCalendarEvents(calendarFile); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(event)
		return

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
}

func loadCalendarEvents(path string) error {
	calendarMutex.Lock()
	defer calendarMutex.Unlock()
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return json.Unmarshal(data, &calendarEvents)
}

func saveCalendarEvents(path string) error {
	calendarMutex.Lock()
	defer calendarMutex.Unlock()
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(calendarEvents, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}