import { create } from 'zustand';

interface SignUpState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profileImage: string | null;
    preferredLocation: string;
    preferredLongitude: number;
    preferredLatitude: number;
    preferences: string[];

    setField: <K extends keyof SignUpState>(field: K, value: SignUpState[K]) => void;
    reset: () => void;
}

export const useSignUpStore = create<SignUpState>((set) => ({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profileImage: null,
    preferredLocation: '',
    preferredLongitude: 0,
    preferredLatitude: 0,
    preferences: [],

    setField: (field, value) => set((state) => ({ ...state, [field]: value })),
    reset: () =>
        set({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            profileImage: null,
            preferredLocation: '',
            preferredLongitude: 0,
            preferredLatitude: 0,
            preferences: [],
        }),
}));
