import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type ConnectionStore = {
    isOffline: boolean;
    setOffline: (offline: boolean) => void;
};

export const useConnectionStore = create<ConnectionStore>((set) => ({
    isOffline: false,
    setOffline: (offline) => set({ isOffline: offline }),
}));

NetInfo.addEventListener((state) => {
    useConnectionStore.getState().setOffline(!state.isConnected);
});
