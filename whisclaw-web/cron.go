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

type CronJob struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Command   string    `json:"command"`
	Schedule  string    `json:"schedule"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"createdAt"`
	LastRun   *time.Time `json:"lastRun,omitempty"`
}

var cronJobs []CronJob
var cronMutex sync.Mutex

func handleCron(w http.ResponseWriter, r *http.Request) {
	cronFile := filepath.Join(os.Getenv("HOME"), ".whisclaw", "cron.json")

	switch r.Method {
	case http.MethodGet:
		if err := loadCronJobs(cronFile); err != nil {
			log.Printf("Failed to load cron jobs: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cronJobs)
		return

	case http.MethodPost:
		var job CronJob
		if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		job.ID = fmt.Sprintf("cron-%d", time.Now().UnixNano())
		job.CreatedAt = time.Now()
		job.Enabled = true
		cronJobs = append(cronJobs, job)

		if err := saveCronJobs(cronFile); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(job)
		return

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
}

func loadCronJobs(path string) error {
	cronMutex.Lock()
	defer cronMutex.Unlock()
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return json.Unmarshal(data, &cronJobs)
}

func saveCronJobs(path string) error {
	cronMutex.Lock()
	defer cronMutex.Unlock()
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cronJobs, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}