package main

import (
	"github.com/spf13/viper"
)

// Config holds WhisClaw configuration
type Config struct {
	Backend         string `json:"backend"`
	MinimaxAPIKey   string `json:"minimax_api_key"`
	MinimaxModel    string `json:"minimax_model"`
	MinimaxURL      string `json:"minimax_url"`
	WhisclawBridgePath string `json:"whisclaw_bridge_path"`
	WhisclawTimeoutMs int    `json:"whisclaw_timeout_ms"`
}

var config *Config

func init() {
	// Set up viper
	viper.SetConfigName("config")
	viper.SetConfigType("json")
	viper.AddConfigPath("/home/pi/.whisclaw")
	viper.AddConfigPath("/tmp/whisclaw/whisclaw-web")

	// Set defaults
	viper.SetDefault("backend", "127.0.0.1:18889")
	viper.SetDefault("minimax_model", "MiniMax-Text-01")
	viper.SetDefault("minimax_url", "https://api.minimax.chat/v1")
	viper.SetDefault("whisclaw_bridge_path", "/usr/local/bin/whisclaw-bridge")
	viper.SetDefault("whisclaw_timeout_ms", 30000)

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		// Config file not found, use defaults
	}
}

// getConfig returns the current configuration
func getConfig() Config {
	if config == nil {
		config = &Config{
			Backend:           viper.GetString("backend"),
			MinimaxAPIKey:     viper.GetString("minimax_api_key"),
			MinimaxModel:      viper.GetString("minimax_model"),
			MinimaxURL:        viper.GetString("minimax_url"),
			WhisclawBridgePath: viper.GetString("whisclaw_bridge_path"),
			WhisclawTimeoutMs:  viper.GetInt("whisclaw_timeout_ms"),
		}
	}
	return *config
}

// saveConfig saves the configuration
func saveConfig(cfg Config) error {
	viper.Set("backend", cfg.Backend)
	viper.Set("minimax_api_key", cfg.MinimaxAPIKey)
	viper.Set("minimax_model", cfg.MinimaxModel)
	viper.Set("minimax_url", cfg.MinimaxURL)
	viper.Set("whisclaw_bridge_path", cfg.WhisclawBridgePath)
	viper.Set("whisclaw_timeout_ms", cfg.WhisclawTimeoutMs)

	return viper.WriteConfig()
}
