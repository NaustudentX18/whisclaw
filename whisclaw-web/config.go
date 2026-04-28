package main

import (
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

var configDir = filepath.Join(os.Getenv("HOME"), ".whisclaw")
var configFile = filepath.Join(configDir, "config.yaml")

func loadConfig(configPath string) (Config, error) {
	if configPath != "" {
		viper.SetConfigFile(configPath)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(configDir)
		viper.AddConfigPath(".")
	}

	viper.SetDefault("gateway.host", "127.0.0.1")
	viper.SetDefault("gateway.port", 18889)
	viper.SetDefault("missionControl.port", 8080)
	viper.SetDefault("missionControl.pollInterval", 30)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return Config{}, err
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func saveConfig(cfg Config) error {
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	viper.Set("model", cfg.Model)
	viper.Set("gateway", cfg.Gateway)
	viper.Set("missionControl", cfg.MissionControl)

	return viper.WriteConfigAs(configFile)
}