package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/google/uuid"
	"golang.org/x/net/websocket"
)

type Server struct {
	conns map[string]map[string]*websocket.Conn
}

// Echo the data received on the WebSocket.
func (s *Server) Handler(ws *websocket.Conn) {
	url := ws.Request().URL.String()
	id := uuid.New().String()
	fmt.Println(url, id)
	if _, ok := s.conns[url]; !ok {
		s.conns[url] = make(map[string]*websocket.Conn)
	}
	s.conns[url][id] = ws
	for {
		data := make([]byte, 64)
		n, err := ws.Read(data)
		if err != nil {
			fmt.Println(id, err)
			break
		}
		fmt.Println(string(data))
		for _, conn := range s.conns[url] {
			conn.Write(data[:n])
		}
	}
	delete(s.conns[url], id)
}

/*
func (s *Server) Handshake(cfg *websocket.Config, req *http.Request) error {
    return nil
}
*/

func main() {
	cfg := websocket.Config{}

	s := Server{make(map[string]map[string]*websocket.Conn)}

	ws := websocket.Server{
		cfg,
		nil,
		s.Handler,
	}
	http.Handle("/", ws)

	local := os.Getenv("BOARD_LOCAL")
	cert_dir := os.Getenv("BOARD_CERT_DIR")

	port := "9000"

	if local == "true" || local == "" {
		host := "localhost"
		url := fmt.Sprintf("%s:%s", host, port)
		fmt.Println("Listening on", url)
		err := http.ListenAndServe(url, nil)
		if err != nil {
			panic("ListenAndServe: " + err.Error())
		}
	} else {
		host := "0.0.0.0"
		url := fmt.Sprintf("%s:%s", host, port)
		fmt.Println("Listening on", url)
		cert_file := fmt.Sprintf("%s/fullchain.pem", cert_dir)
		key_file := fmt.Sprintf("%s/privkey.pem", cert_dir)
		err := http.ListenAndServeTLS(url, cert_file, key_file, nil)
		if err != nil {
			panic("ListenAndServe: " + err.Error())
		}
	}
}

