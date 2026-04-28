package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	configPath := flag.String("config", "", "Path to config file")
	port := flag.String("port", "8080", "Port to listen on")
	flag.Parse()

	cfg, err := loadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	_ = cfg // cfg used for future gateway config access

	mux := http.NewServeMux()
	mux.HandleFunc("/api/status", handleStatus)
	mux.HandleFunc("/api/config", handleConfig)
	mux.HandleFunc("/api/cron", handleCron)
	mux.HandleFunc("/api/calendar", handleCalendar)
	mux.HandleFunc("/api/system", handleSystem)
	mux.HandleFunc("/api/skills", handleSkills)
	mux.HandleFunc("/ws", handleWebSocket)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", *port),
		Handler: mux,
	}

	go func() {
		log.Printf("Mission Control server starting on port %s", *port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}