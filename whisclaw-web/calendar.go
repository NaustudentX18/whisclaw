package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"
)

// CalendarEvent represents a calendar event
type CalendarEvent struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Date        string    `json:"date"`         // YYYY-MM-DD format
	Time        string    `json:"time"`         // HH:MM format
	Description string    `json:"description"`
	Reminder    int       `json:"reminder"`     // minutes before event
	CreatedAt   time.Time `json:"createdAt"`
}

var (
	calendarEvents = make(map[string]CalendarEvent)
	calendarMux    sync.RWMutex
	calendarFile   = "/tmp/whisclaw/whisclaw-web/calendar.json"
)

// ListCalendarEvents returns all calendar events
func ListCalendarEvents() []CalendarEvent {
	calendarMux.RLock()
	defer calendarMux.RUnlock()

	events := make([]CalendarEvent, 0, len(calendarEvents))
	for _, event := range calendarEvents {
		events = append(events, event)
	}
	return events
}

// CreateCalendarEvent adds a new calendar event
func CreateCalendarEvent(event CalendarEvent) error {
	calendarMux.Lock()
	defer calendarMux.Unlock()

	event.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	event.CreatedAt = time.Now()

	calendarEvents[event.ID] = event
	return saveCalendarEventsLocked()
}

// DeleteCalendarEvent removes a calendar event by ID
func DeleteCalendarEvent(id string) error {
	calendarMux.Lock()
	defer calendarMux.Unlock()

	if _, exists := calendarEvents[id]; !exists {
		return fmt.Errorf("calendar event not found: %s", id)
	}

	delete(calendarEvents, id)
	return saveCalendarEventsLocked()
}

// saveCalendarEventsLocked saves calendar events to file (must hold lock)
func saveCalendarEventsLocked() error {
	data, err := json.MarshalIndent(calendarEvents, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(calendarFile, data, 0644)
}

// LoadCalendarEvents loads calendar events from file
func LoadCalendarEvents() error {
	calendarMux.Lock()
	defer calendarMux.Unlock()

	data, err := os.ReadFile(calendarFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return json.Unmarshal(data, &calendarEvents)
}
