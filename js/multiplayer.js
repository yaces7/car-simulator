// Multiplayer - WebSocket bağlantısı (opsiyonel)
class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.players = new Map();
    }

    connect(url, playerName) {
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                console.log('Sunucuya bağlandı');
                this.connected = true;
                this.ws.send(JSON.stringify({
                    type: 'join',
                    name: playerName
                }));
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket hatası:', error);
                this.connected = false;
            };

            this.ws.onclose = () => {
                console.log('Bağlantı kesildi');
                this.connected = false;
            };
        } catch (error) {
            console.error('Bağlantı hatası:', error);
            this.connected = false;
        }
    }

    handleMessage(data) {
        // Sunucudan gelen mesajları işle
        console.log('Mesaj alındı:', data);
    }

    sendPosition(position, rotation) {
        if (this.connected && this.ws) {
            this.ws.send(JSON.stringify({
                type: 'position',
                position: position,
                rotation: rotation
            }));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
