package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true
		}
		// Allow localhost and private LAN origins
		u, err := url.Parse(origin)
		if err != nil {
			return false
		}
		host := u.Hostname()
		return host == "localhost" || host == "127.0.0.1" || host == "::1" ||
			host == "localhost" || strings.HasPrefix(host, "192.168.") ||
			host == "10.0.0.1" || strings.HasPrefix(host, "10.") ||
			host == "172.16.0.1" || strings.HasPrefix(host, "172.")
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	gatewayHost := flag.Lookup("gateway-host").Value.String()
	gatewayPort := flag.Lookup("gateway-port").Value.String()
	if gatewayHost == "" {
		gatewayHost = "127.0.0.1"
	}
	if gatewayPort == "" {
		gatewayPort = "18889"
	}

	gatewayURL := url.URL{
		Scheme: "ws",
		Host:   fmt.Sprintf("%s:%s", gatewayHost, gatewayPort),
		Path:   "/ws",
	}

	gatewayConn, _, err := websocket.DefaultDialer.Dial(gatewayURL.String(), nil)
	if err != nil {
		log.Printf("Failed to connect to gateway: %v", err)
		http.Error(w, "Failed to connect to gateway", http.StatusBadGateway)
		return
	}
	defer gatewayConn.Close()

	browserConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer browserConn.Close()

	done := make(chan struct{})
	var doneOnce sync.Once
	closeDone := func() { doneOnce.Do(func() { close(done) }) }

	go func() {
		for {
			_, msg, err := browserConn.ReadMessage()
			if err != nil {
				closeDone()
				return
			}
			if err := gatewayConn.WriteMessage(websocket.TextMessage, msg); err != nil {
				closeDone()
				return
			}
		}
	}()

	go func() {
		for {
			_, msg, err := gatewayConn.ReadMessage()
			if err != nil {
				closeDone()
				return
			}
			if err := browserConn.WriteMessage(websocket.TextMessage, msg); err != nil {
				closeDone()
				return
			}
		}
	}()

	<-done
}

func init() {
	flag.String("gateway-host", "127.0.0.1", "WhisClaw gateway host")
	flag.String("gateway-port", "18889", "WhisClaw gateway port")
}

