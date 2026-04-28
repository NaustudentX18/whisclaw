package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"
)

// CronJob represents a scheduled cron job
type CronJob struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Schedule  string    `json:"schedule"`  // cron expression
	Command   string    `json:"command"`
	LastRun   time.Time `json:"lastRun"`
	NextRun   time.Time `json:"nextRun"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"createdAt"`
}

var (
	cronJobs = make(map[string]CronJob)
	cronMux  sync.RWMutex
	cronFile = "/tmp/whisclaw/whisclaw-web/cron.json"
)

// ListCronJobs returns all cron jobs
func ListCronJobs() []CronJob {
	cronMux.RLock()
	defer cronMux.RUnlock()

	jobs := make([]CronJob, 0, len(cronJobs))
	for _, job := range cronJobs {
		jobs = append(jobs, job)
	}
	return jobs
}

// CreateCronJob adds a new cron job
func CreateCronJob(job CronJob) error {
	cronMux.Lock()
	defer cronMux.Unlock()

	job.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	job.CreatedAt = time.Now()
	job.NextRun = calculateNextRun(job.Schedule)

	cronJobs[job.ID] = job
	return saveCronJobsLocked()
}

// DeleteCronJob removes a cron job by ID
func DeleteCronJob(id string) error {
	cronMux.Lock()
	defer cronMux.Unlock()

	if _, exists := cronJobs[id]; !exists {
		return fmt.Errorf("cron job not found: %s", id)
	}

	delete(cronJobs, id)
	return saveCronJobsLocked()
}

// saveCronJobsLocked saves cron jobs to file (must hold lock)
func saveCronJobsLocked() error {
	data, err := json.MarshalIndent(cronJobs, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(cronFile, data, 0644)
}

// LoadCronJobs loads cron jobs from file
func LoadCronJobs() error {
	cronMux.Lock()
	defer cronMux.Unlock()

	data, err := os.ReadFile(cronFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return json.Unmarshal(data, &cronJobs)
}

// calculateNextRun calculates the next run time from a cron expression
// This is a simplified implementation
func calculateNextRun(schedule string) time.Time {
	// Simplified: just return 1 hour from now for demo
	// Real implementation would parse cron expression
	return time.Now().Add(time.Hour)
}
