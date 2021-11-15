import React, {useEffect, useState} from 'react';
import {Col, Row, Layout, Button, Card, Radio, Input, Typography, Divider, message, Select} from "antd";
import {CheckCircleOutlined, CloseCircleOutlined, SyncOutlined} from "@ant-design/icons";
import './App.less';

import {useAuth} from "./context/AuthProvider";
import {useSumu} from "./context/SumuProvider";

import Code from "./containers/Code";

const {Content, Header} = Layout;
const {TextArea} = Input;
const {Paragraph, Text} = Typography;

const App = (props: any) => {

    const {logout} = useAuth();
    const {connect, disconnect, publish, send, ping, connected, connecting, connectedUsers} = useSumu()
    const [pushMode, setPushMode] = useState<string>("UNICAST");
    const [msg, setMsg] = useState<string>("");
    const [users, setUsers] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        connect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function doPublish() {
        if (pushMode === "MULTICAST" && !(users && users.length !== 0)){
            message.error("Push mode is multicast, please select users!")
            return
        }

        if (msg) {
            publish("message", {
                text: msg,
                push_mode: pushMode,
                users: users
            })
            setMsg("")
        } else
            message.error("Please enter the message!")
    }

    function doSend() {
        if (pushMode === "MULTICAST" && !(users && users.length !== 0)){
            message.error("Push mode is multicast, please select users!")
            return
        }
        if (msg) {
            send("message", {
                text: msg,
                push_mode: pushMode,
                users: users
            })
            setMsg("")
        } else
            message.error("Please enter the message!")
    }

    function doPing() {
        ping()
    }

    function doConnect() {
        connect()
    }

    function doDisconnect() {
        disconnect()
    }

    function stateColor() {
        if (connected && !connecting) return "#00BFA6";
        else if (!connected && !connecting) return "#F50057";
        else if (connecting) return "#00B0FF";
    }

    function connectedUsersOptions() {
        const options:any = []
        connectedUsers.forEach((user:any) => {
            options.push({
                label: user,
                value: user
            })
        });
        return options;
    }


    return (<>
        <Layout>
            <Header
                style={{
                    backgroundColor: "#141414",
                    borderBottom: `1px solid ${stateColor()}`
                }}
            >
                <Row align={"middle"} justify={"space-between"} style={{width: "100%", height: "100%"}}>
                    {connected && !connecting && <CheckCircleOutlined style={{fontSize: 25, color: stateColor()}}/>}
                    {!connected && !connecting && <CloseCircleOutlined style={{fontSize: 25, color: stateColor()}}/>}
                    {connecting && <SyncOutlined spin style={{fontSize: 25, color: stateColor()}}/>}

                    {connectedUsers.size>0 && <Text style={{color: "#00BFA6"}}>{`${connectedUsers.size}`} Users Connected</Text>}
                    {connectedUsers.size===0 && <Text style={{color: "#F50057"}}>No User Connected</Text>}

                    <Button
                        onClick={e => logout()}
                        type="primary"
                        ghost
                    >
                        Logout
                    </Button>
                </Row>
            </Header>

            <Content
                style={{
                    padding: '0 50px',
                    paddingTop: 10,
                    backgroundColor: "#282c34"
                }}
            >
                <Row>
                    <Row style={{width: "100%" , marginBottom: 16}} align={"middle"} gutter={16}>


                        <Col span={8} style={{display: 'flex'}}>
                            <Code
                                title={"Publish message"} code={"publish"}
                                onClick={doPublish}
                                disabled={!connected}
                            />
                        </Col>

                        <Col span={8} style={{display: 'flex'}}>
                            {/*<Row style={{width: "100%"}}>*/}
                            {/*    <Image src={"/arch.svg"}/>*/}
                            {/*</Row>*/}

                            <Card title={"Message Params"} style={{width: "100%"}}>
                                <Row style={{width: "100%"}} justify={"center"}>
                                    <Radio.Group
                                        defaultValue="UNICAST"
                                        onChange={e => setPushMode(e.target.value)}
                                        style={{marginTop: 16, marginBottom: 16}}
                                    >
                                        <Radio.Button value="UNICAST">UNICAST</Radio.Button>
                                        <Radio.Button value="MULTICAST">MULTICAST</Radio.Button>
                                        <Radio.Button value="BROADCAST">BROADCAST</Radio.Button>
                                    </Radio.Group>
                                </Row>
                                <Row>
                                    {pushMode === "UNICAST" &&
                                    <Paragraph type={"secondary"}>The message will be sent to <Text strong>just
                                        you!</Text></Paragraph>}
                                    {pushMode === "MULTICAST" &&
                                    <Paragraph type={"secondary"}>The message will be sent to <Text strong>selected
                                        users!</Text></Paragraph>}
                                    {pushMode === "BROADCAST" &&
                                    <Paragraph type={"secondary"}>The message will be sent to <Text strong>all
                                        users except you!</Text></Paragraph>}
                                    <TextArea rows={2}
                                              maxLength={150}
                                              allowClear
                                              showCount
                                              autoSize={{minRows: 3, maxRows: 3}}
                                              placeholder={"Your message"}
                                              onChange={e => setMsg(e.target.value)}
                                              style={{width: "100%"}}
                                              value={msg}
                                    />
                                </Row>
                                {pushMode === "MULTICAST" &&
                                    <>
                                        <Divider/>
                                        <Select
                                            mode="multiple"
                                            maxTagCount="responsive"
                                            placeholder="Select users..."
                                            options={connectedUsersOptions()}
                                            value={users}
                                            style={{width: "100%"}}
                                            onChange={(selectedUsers: string[]) => {setUsers(selectedUsers);}}
                                        />
                                    </>
                                }
                            </Card>

                        </Col>


                        <Col span={8} style={{display: 'flex'}}>
                            <Code
                                title={"Send message"} code={"send"}
                                onClick={doSend}
                                disabled={!connected}
                            />
                        </Col>
                    </Row>

                    <Row style={{width: "100%"}} gutter={16}>
                        <Col span={8} style={{display: 'flex'}}>
                            <Code
                                title={"Connect"} code={"connect"}
                                onClick={doConnect}
                                loading={connecting}
                                disabled={connected}
                            />
                        </Col>

                        <Col span={8} style={{display: 'flex'}}>
                            <Code
                                title={"Disconnect"} code={"disconnect"}
                                onClick={doDisconnect}
                                disabled={!connected}
                            />
                        </Col>

                        <Col span={8} style={{display: 'flex'}}>
                            <Code
                                title={"Ping"} code={"ping"}
                                onClick={doPing}
                                disabled={!connected}
                            />
                        </Col>
                    </Row>
                </Row>
            </Content>
        </Layout>
    </>)

}

export default App;
