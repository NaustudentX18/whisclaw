package main

import (
	"os/exec"
	"strings"
)

// Skill represents a WhisClaw CLI skill
type Skill struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// ListSkills returns available WhisClaw CLI skills
func ListSkills() []Skill {
	// Try to get skills from whisclaw CLI if available
	skills := getDefaultSkills()

	// Try to enumerate additional skills from CLI
	output, err := exec.Command("whisclaw", "skills", "list").Output()
	if err == nil {
		// Parse CLI output and merge with defaults
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if line != "" && !strings.HasPrefix(line, "#") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					skills = append(skills, Skill{
						Name:        strings.TrimSpace(parts[0]),
						Description: strings.TrimSpace(parts[1]),
						Category:    "cli",
					})
				}
			}
		}
	}

	return skills
}

// getDefaultSkills returns the default skill list
func getDefaultSkills() []Skill {
	return []Skill{
		{Name: "voice", Description: "Voice recognition and synthesis", Category: "core"},
		{Name: "chat", Description: "AI chat interactions", Category: "core"},
		{Name: "calendar", Description: "Calendar management", Category: "productivity"},
		{Name: "reminders", Description: "Set and manage reminders", Category: "productivity"},
		{Name: "weather", Description: "Weather information", Category: "information"},
		{Name: "news", Description: "News headlines", Category: "information"},
		{Name: "music", Description: "Music playback control", Category: "media"},
		{Name: "radio", Description: "Internet radio streaming", Category: "media"},
		{Name: "timer", Description: "Set timers and alarms", Category: "utility"},
		{Name: "cron", Description: "Scheduled task management", Category: "system"},
		{Name: "system", Description: "System information and control", Category: "system"},
		{Name: "wifi", Description: "WiFi management", Category: "system"},
		{Name: "bluetooth", Description: "Bluetooth device management", Category: "system"},
		{Name: "backup", Description: "Backup and restore data", Category: "system"},
		{Name: "update", Description: "Update WhisClaw software", Category: "system"},
	}
}
