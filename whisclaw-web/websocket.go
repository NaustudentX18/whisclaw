package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
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

	go func() {
		for {
			_, msg, err := browserConn.ReadMessage()
			if err != nil {
				close(done)
				return
			}
			if err := gatewayConn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	go func() {
		for {
			_, msg, err := gatewayConn.ReadMessage()
			if err != nil {
				close(done)
				return
			}
			if err := browserConn.WriteMessage(websocket.TextMessage, msg); err != nil {
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

func relayMessages(browserConn, gatewayConn *websocket.Conn, done chan struct{}) {
	for {
		select {
		case <-done:
			return
		default:
			gatewayConn.SetReadDeadline(time.Now().Add(60 * time.Second))
			_, msg, err := gatewayConn.ReadMessage()
			if err != nil {
				return
			}
			if err := browserConn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}

type WebSocketMessage struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}