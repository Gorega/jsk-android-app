import Notifications from "../../components/Notifications";
import { useLocalSearchParams } from "expo-router";

export default function NotificationsPage() {
    const { refreshKey } = useLocalSearchParams();
    return <Notifications key={refreshKey} />;
}