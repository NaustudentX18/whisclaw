package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
)

type Skill struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
	Enabled     bool   `json:"enabled"`
}

func handleSkills(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	skillsDir := filepath.Join(os.Getenv("HOME"), ".whisclaw", "skills")
	skills := listSkills(skillsDir)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(skills)
}

func listSkills(dir string) []Skill {
	var skills []Skill

	entries, err := os.ReadDir(dir)
	if err != nil {
		return skills
	}

	for _, entry := range entries {
		if entry.IsDir() {
			skill := Skill{
				Name:    entry.Name(),
				Enabled: true,
			}
			skills = append(skills, skill)
		}
	}

	return skills
}