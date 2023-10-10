package main

import (
    "fmt"
	"net/http"

	"golang.org/x/net/websocket"
    "github.com/google/uuid"
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
        fmt.Println(string(data));
        for _,conn := range s.conns[url] {
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
    fmt.Println("Listening on 8000")
    err := http.ListenAndServe("localhost:8000", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}

}
