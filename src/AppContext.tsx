import { createContext } from 'react';
import LmApi from './api/LmApi';

interface AppContextType {
    api: LmApi,
    loading: boolean, setLoading: any,
    serverUnavailable: boolean, setServerUnavailable: any,
    agreeTerms: boolean, setAgreeTerms: any,
    agreePrivacy: boolean, setAgreePrivacy: any,
    community: any, setCommunity: any,
    name: string, setName: any,
    snackText: string|null, setSnackText: any
}

const AppContext = createContext<AppContextType|null>(null);

export default AppContext;
