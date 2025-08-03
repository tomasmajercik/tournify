import { useState } from "react"
import * as Location from "expo-location"

const useLocation = () => {
    const [error, setError] = useState("")
    const [longitude, setLongitude] = useState(0)
    const [latitude, setLatitude] = useState(0)

    const getUserLocation = async () => {
        let {status} = await Location.requestForegroundPermissionsAsync();

        if(status !== 'granted'){
            setError('Tournify will use your prefered location from profile.');
            return;
        }

        let {coords} = await Location.getCurrentPositionAsync();

        if(coords){
            const {latitude, longitude} = coords;
            // console.log('lat and long is ', latitude, longitude); // if debug is needed
            setLatitude(latitude);
            setLongitude(longitude);

            //// very cool print of city, state, postal code, street, even timezone etc
            // let response = await Location.reverseGeocodeAsync({
            //     latitude,
            //     longitude
            // })
            // console.log('USER LOCATION IS', response);
        }
    };
    return {latitude, longitude, error, getUserLocation}
};
export default useLocation;