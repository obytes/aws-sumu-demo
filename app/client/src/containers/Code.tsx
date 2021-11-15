import React from "react";
import {Button, Card, Row, Typography} from "antd";
import {PlayCircleOutlined} from "@ant-design/icons";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {atomDark} from "react-syntax-highlighter/dist/esm/styles/prism";

const {Paragraph, Text} = Typography;

let publish = `
function publish(type: string, msg: {}): void {
    if (ws && connected) {
        ws.json({
            action: 'publish',
            message: {type: type, message: msg}
        });
        message.success("Message published!");
    } else message.error("Not yet connected!")
}
`;

let send = `
function send(type: string, msg: {}): void {
    if (ws && connected) {
        ws.json({
            action: 'send',
            message: {type: type, message: msg}
        });
        message.success("Message sent!");
    } else message.error("Not yet connected!")
}
`;

let ping = `
function ping() {
    if (ws && connected) {
        ws.json({action: 'ping'});
    } else message.error("Not yet connected!")
}

function keepAlive() {
    if (ws && connected) {
        clearInterval(keepAliveInterval)
        keepAliveInterval = setInterval(ping, 3 * 60 * 1000) // Every 3 minutes
    } else message.error("Not yet connected!")
}
`;

let disconnect = `
function disconnect(raise = true): void {
    if (ws && connected && !connecting) {
        clearInterval(keepAliveInterval);
        ws.close()
        setConnected(false)
    } else {
        message.error("Already disconnected!")
    }
}
`

let connect = `
public connect(accessToken: string): void {
    let endpoint = \`wss://live.kodhive.com/push?authorization=\${accessToken}\`;
    setConnecting(true);
    ws = new Sockette(endpoint, {
        timeout: 5e3,
        maxAttempts: 5,
        onopen: e => {keepAlive();setConnected(true);setConnecting(false);},
        onmessage: e => {
            console.log(JSON.parse(e.data).message)
        },
    });
}
`

let codes: any = {
    publish: {
        code: publish,
        description: <Paragraph type={"secondary"}>The message will be sent to <Text code>APIGW</Text> that will publish it to <Text code>SNS</Text>,
            the subscribed backend will receive and process the message and notify the user(s) through the <Text code>Pusher</Text>.</Paragraph>
    },
    send: {
        code: send,
        description: <Paragraph type={"secondary"}>The message will be sent to <Text code>APIGW</Text> that will send it to <Text code>SQS</Text>,
            the backend will poll and process batch of messages and notify the user(s) through the <Text code>Pusher</Text>.</Paragraph>
    },
    ping: {
        code: ping,
        description: <Paragraph type={"secondary"}>The message will be sent to <Text code>APIGW</Text> that will send it to <Text code>ITSELF</Text>,
            the <Text code>APIGW</Text> will send back a Pong frame to ensure the connection to the user stays alive. this <Text code>KeepAlive</Text> process is done periodically every 3 minutes.</Paragraph>
    },
    disconnect: {
        code: disconnect,
        description: <Paragraph type={"secondary"}>Disconnection request will be sent to <Text code>APIGW</Text> that will delete the user
            id and connection id from <Text code>DynamoDB</Text> table, and the presence watchdog will notify other users about the
            <Text code>OFFLINE</Text> event.</Paragraph>
    },
    connect: {
        code: connect,
        description: <Paragraph type={"secondary"}>Connection request will be sent to <Text code>APIGW</Text> that will authenticate the
            request using the <Text code>JWT Authorizer</Text>, persist user id and connection id in <Text code>DynamoDB</Text> Table. and the
            presence watchdog will notify other users about the <Text code>ONLINE</Text> event.</Paragraph>
    }
}

const Code = (props: any) => {
    return (
        <Card title={props.title} extra={
            <Button
                style={{float: "left"}}
                icon={<PlayCircleOutlined/>}
                type="primary"
                onClick={event => props.onClick()}
                loading={props.loading}
                disabled={props.disabled}
                ghost
            />
        } style={{width: "100%"}}>
            <Row style={{width: "100%"}}>
                {codes[props.code]["description"]}
            </Row>
            <Row style={{width: "100%"}}>
                <SyntaxHighlighter language="typescript" style={atomDark} customStyle={{width: "100%"}}>
                    {codes[props.code]["code"]}
                </SyntaxHighlighter>
            </Row>
        </Card>
    );
};

export default Code;