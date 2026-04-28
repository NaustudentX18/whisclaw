package main

import (
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for local development
	},
}

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512
)

// handleWebSocket upgrades HTTP to WebSocket and proxies to picoclaw gateway
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Connect to picoclaw gateway
	gatewayURL := "ws://127.0.0.1:18889"
	gatewayConn, _, err := websocket.DefaultDialer.Dial(gatewayURL, nil)
	if err != nil {
		log.Printf("Failed to connect to picoclaw gateway at %s: %v", gatewayURL, err)
		return
	}
	defer gatewayConn.Close()

	// Channel to signal goroutine termination
	done := make(chan struct{})

	// Relay messages from browser to gateway
	go func() {
		for {
			select {
			case <-done:
				return
			default:
				_, msg, err := conn.ReadMessage()
				if err != nil {
					if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
						log.Printf("Browser read error: %v", err)
					}
					close(done)
					return
				}
				if err := gatewayConn.WriteMessage(websocket.TextMessage, msg); err != nil {
					log.Printf("Gateway write error: %v", err)
					close(done)
					return
				}
			}
		}
	}()

	// Relay messages from gateway to browser with ping handling
	gatewayConn.SetReadLimit(maxMessageSize)
	gatewayConn.SetReadDeadline(time.Now().Add(pongWait))
	gatewayConn.SetPongHandler(func(string) error {
		gatewayConn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			if err := gatewayConn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				return
			}
			if err := gatewayConn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Ping failed: %v", err)
				return
			}
		default:
			_, msg, err := gatewayConn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Gateway read error: %v", err)
				}
				return
			}
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				log.Printf("Browser write error: %v", err)
				return
			}
		}
	}
}

// serveStatic serves static files from the static/ directory
func serveStatic(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, "/tmp/whisclaw/whisclaw-web/static/index.html")
}

// copyAndClose copies all data from src to dst and closes both connections
func copyAndClose(dst, src *websocket.Conn, dstName, srcName string) {
	defer dst.Close()
	defer src.Close()

	for {
		_, message, err := src.ReadMessage()
		if err != nil {
			if err != io.EOF && !websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("%s read error: %v", srcName, err)
			}
			return
		}
		if err := dst.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("%s write error: %v", dstName, err)
			return
		}
	}
}
