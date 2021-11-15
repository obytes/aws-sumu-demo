import React, {useState, useEffect} from 'react';
import {initializeApp} from 'firebase/app';
import {getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged} from "firebase/auth";
import {Spin, message} from 'antd';
import Auth from '../containers/Auth'

initializeApp({
    "apiKey": process.env.REACT_APP_FIREBASE_API_KEY,
    "authDomain": process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    "projectId": process.env.REACT_APP_FIREBASE_PROJECT_ID,
    "measurementId": process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
});


interface AuthContextData {
    user: any;
    loading: boolean;

    login(): void;

    logout(): void;
}

const initial = {
    user: null,
};

const AuthContext = React.createContext<AuthContextData>(initial as AuthContextData);
const auth = getAuth()

function AuthProvider({children}: any) {
    const [loading, setLoading] = useState<boolean>(true);
    const [bootstrapping, setBootstrapping] = useState<boolean>(true);
    const [user, setUser] = useState<any>(null);

    function login() {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).then(function (result) {
            setUser(result.user);
            setLoading(false)
        }).catch(function (error: any) {
            console.log(error.message);
            message.error("Unable to sign in");
            setLoading(false)
        });
    }

    function logout() {
        signOut(auth).then(function () {
            // Sign-out successful.
        }).catch(function (error: any) {
            console.log(error)
        });
    }

    /** ======================
     *  Hooks
     ---------------------- */
    useEffect(() => {
        setBootstrapping(true);
        setLoading(true);
        onAuthStateChanged(auth, (user: any) => {
            setUser(user);
            setBootstrapping(false);
            setLoading(false)
        });
    }, []);

    return (
        <AuthContext.Provider value={
            {
                user: user,
                loading: loading,
                login: login,
                logout: logout
            }
        }>
            {
                user ? children : bootstrapping ?
                    <Spin spinning={loading} size="large" style={{
                        width: "100%",
                        height: "100vh",
                        lineHeight: "100vh"
                    }}/> :
                    <Auth/>
            }
        </AuthContext.Provider>
    )
}

const useAuth = () => React.useContext(AuthContext);
export {AuthProvider, useAuth}