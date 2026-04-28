package main

import (
	"log"
	"net/http"
)

func main() {
	// Set up handlers
	http.HandleFunc("/", serveStatic)
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/config", handleConfig)
	http.HandleFunc("/api/cron", handleCron)
	http.HandleFunc("/api/calendar", handleCalendar)
	http.HandleFunc("/api/skills", handleSkills)

	// Start server
	log.Println("WhisClaw Web Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
