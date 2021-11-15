import React, {useState, useEffect} from 'react'
import {message, notification} from 'antd';
import Sockette from "sockette";

import {useAuth} from "./AuthProvider";

interface SumuContextData {
    connecting: boolean;
    connected: boolean;
    connectedUsers: any;

    connect(): void;

    disconnect(raise?: boolean): void;

    ping(): void;

    send(type: string, message: {}): void;

    publish(type: string, message: {}): void;
}

const initial = {
    connecting: false,
    connected: false
};

const SumuContext = React.createContext<SumuContextData>(initial as SumuContextData);
let keepAliveInterval: any = null;

function SumuProvider({children}: any) {

    const [connected, setConnected] = useState<boolean>(false);
    const [connecting, setConnecting] = useState<boolean>(false);
    const [ws, setWS] = useState<Sockette | null>(null);
    const {user} = useAuth();
    const [connectedUsers, setConnectedUsers] = useState(new Set());

    function connect(): void {
        if (connected || connecting) {
            message.error("Already connected!")
        } else {
            // Initiate connection through react hook
            setConnecting(true);
        }
    }

    function disconnect(raise = true): void {
        if (ws && connected && !connecting) {
            clearInterval(keepAliveInterval);
            console.log("Closing connections");
            ws.close()
        } else {
            if (raise) {
                message.error("Already disconnected!")
            }
        }
    }

    function send(type: string, msg: {}): void {
        if (ws && connected) {
            console.log("Send message");
            ws.json({
                action: 'send',
                message: {
                    type: type,
                    message: msg
                }
            });
            message.success("Message sent!");
        } else message.error("Not yet connected!")
    }

    function publish(type: string, msg: {}): void {
        if (ws && connected) {
            console.log("Publish message");
            ws.json({
                action: 'publish',
                message: {
                    type: type,
                    message: msg
                }
            });
            message.success("Message published!");
        } else message.error("Not yet connected!")
    }


    function ping() {
        if (ws && connected) {
            console.log("Send ping")
            ws.json({action: 'ping'});
        } else message.error("Not yet connected!")
    }

    function keepAlive() {
        if (ws && connected) {
            console.log("Keep alive")
            let interval = 3 * 60 * 1000 // Every 3 minutes
            clearInterval(keepAliveInterval)
            keepAliveInterval = setInterval(ping, interval)
        } else message.error("Not yet connected!")
    }

    /** ======================
     *  Hooks
     ---------------------- */
    useEffect(() => {
        if (connected && !connecting) {
            keepAlive();
            publish("get_connected_users", {usage: "contact"});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, connecting]);


    useEffect(() => {
        return () => {
            if (ws) {
                console.log("Tear down")
                clearInterval(keepAliveInterval);
                ws.close();
            }
        };
    }, [ws]);

    useEffect(() => {
        if (connecting) {
            user.getIdToken().then((accessToken: string) => {
                let endpoint = `${process.env.REACT_APP_WEBSOCKET_URL}?authorization=${accessToken}`;
                let sumuWebsocket = new Sockette(
                    endpoint,
                    {
                        timeout: 5e3,
                        maxAttempts: 5,
                        onopen: e => {
                            notification.success({
                                message: "Connected",
                                placement: 'bottomLeft'
                            });
                            setConnected(true)
                            setConnecting(false)
                        },
                        onmessage: messageHandler,
                        onreconnect: e => {
                            notification.warning({
                                message: "Reconnecting...",
                                placement: "bottomLeft"
                            });
                        },
                        onmaximum: e => {
                            notification.error({
                                message: "Could not connect to server, stop attempting!",
                                placement: "bottomLeft"
                            });
                            setConnected(false)
                        },
                        onclose: e => {
                            console.log("Closed!", e);
                            notification.error({
                                message: "Disconnected!",
                                placement: 'bottomLeft'
                            });
                            setConnected(false)
                        },
                        onerror: e => {
                            console.log("Error:", e);
                            setConnected(false)
                        },
                    }
                );
                setWS(sumuWebsocket)
            });
        }
    }, [connecting])

    const messageHandler = (e: any) => {
        let payload = JSON.parse(e.data);
        let m = payload.message;
        switch (payload.type) {
            case "connected_users":
                setConnectedUsers(new Set(m["users"]))
                break;
            case "message":
                notification.warning({
                    message: "New message",
                    description: m.text,
                    placement: "topRight"
                });
                break;
            case "presence":
                let presence = `${m.user_id} is ${m.status}`;
                if (m.status === "OFFLINE") {
                    notification.error({
                        message: "Presence",
                        description: presence,
                        placement: "topRight"
                    });
                    const newConnected = new Set(connectedUsers);
                    newConnected.delete(m.user_id)
                    setConnectedUsers(newConnected);
                } else if (m.status === "ONLINE") {
                    notification.success({
                        message: "Presence",
                        description: presence,
                        placement: "topRight"
                    });
                    const newConnected = new Set(connectedUsers).add(m.user_id)
                    console.log(newConnected)
                    setConnectedUsers(newConnected);
                }


                break;
            case "pong":
                notification.warning({
                    message: "Keep Alive",
                    description: "Received Pong from API Gateway",
                    placement: "bottomLeft"
                });
                break;
            default:
                break;
        }
    }

    return (
        <SumuContext.Provider value={
            {
                connecting: connecting,
                connected: connected,
                connectedUsers: connectedUsers,
                connect: connect,
                disconnect: disconnect,
                ping: ping,
                send: send,
                publish: publish
            }
        }>
            {
                children
            }
        </SumuContext.Provider>
    )
}

const useSumu = () => React.useContext(SumuContext);
export {SumuProvider, useSumu}