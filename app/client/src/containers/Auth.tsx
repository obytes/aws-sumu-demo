import {Row, Button, Typography, Col, Image} from 'antd'
import {GoogleOutlined} from "@ant-design/icons";


import {useAuth} from "../context/AuthProvider";


const Title = Typography.Title;

const AuthPage = () => {

    const {login, loading} = useAuth();

    function handleAuth() {
        login()
    }

    return (
        <Row justify="center" align="middle" style={{minHeight: '100vh'}}>
            <Col xxl={12} xl={12} md={12} lg={12} sm={24} xs={24}>
                <Row justify="center" style={{width: "100%", marginBottom: "10px"}}>
                    <Row style={{width: "50%", marginBottom: "10px"}}>
                        <Image src={"/login.svg"} alt="Login" preview={false}/>
                    </Row>
                </Row>

                <Row justify="center" style={{width: "100%", marginBottom: "26px"}}>
                    <Title>Welcome to SUMU!</Title>
                </Row>

                <Row justify="center">
                    <Button onClick={handleAuth} icon={<GoogleOutlined/>} loading={loading} size={"large"}>
                        Sign in with Google
                    </Button>
                </Row>
            </Col>
        </Row>

    )
};

export default AuthPage